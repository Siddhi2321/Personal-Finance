const md5 = require('md5');
const myDB = require('mysql2');

const con = myDB.createConnection({
    host: 'localhost',
    user: 'root',
    password: '#Siddhi2321',
    database: 'odyssey'
});

con.connect(err => {
    if (err) {
        console.error('Error connecting to the database:', err);
    } else {
        console.log('Connected to the database');
    }
});

function doLogin(req, res, view = 'none') {
    const { name, password } = req.body;
    con.query(
        `SELECT username, email, userID FROM users WHERE username = ? AND password = ?`,
        [name, md5(password)],
        (qErr, result) => {
            if (qErr) {
                res.send("<h2>db error</h2>");
            } else {
                if (result.length != 0) {
                    req.session.loggedIn = true;
                    req.session.user = result[0].username;
                    req.session.userID = result[0].userID;
                    res.redirect('/dashboard');
                } else {
                    res.send("Your username or password is wrong! Please try again");
                }
            }
        }
    );
}

function registerUser(req, res) {
    const { username, email, password } = req.body;
    con.query(
        `INSERT INTO users (username, email, password) VALUES (?, ?, ?)`,
        [username, email, md5(password)],
        (qErr, result) => {
            if (qErr) {
                res.send("Database error during registration");
            } else {
                res.send("Registration successful. You can now log in.");
            }
        }
    );
}

function changePassword(req, res) {
    const { oldPassword, newPassword } = req.body;
    const userId = req.session.userID;
    con.query(
        `UPDATE users SET password = ? WHERE userID = ? AND password = ?`,
        [md5(newPassword), userId, md5(oldPassword)],
        (qErr, result) => {
            if (qErr) {
                res.send("Database error during password change");
            } else {
                if (result.affectedRows > 0) {
                    res.send("Password changed successfully");
                } else {
                    res.send("Old password is incorrect");
                }
            }
        }
    );
}

function forgotPassword(req, res) {
    const { email, newPassword } = req.body;
    con.query(
        `UPDATE users SET password = ? WHERE email = ?`,
        [md5(newPassword), email],
        (qErr, result) => {
            if (qErr) {
                res.send("Database error during password reset");
            } else {
                if (result.affectedRows > 0) {
                    res.send("Password reset successfully. You can now log in with the new password.");
                } else {
                    res.send("No user found with that email address");
                }
            }
        }
    );
}

function getData(req, tableName) {
    return new Promise((resolve, reject) => {
        const userId = req.session.userID;
        con.query(`SELECT * FROM ?? WHERE userID = ?`, [tableName, userId], (err, results) => {
            if (err) {
                reject(err); // If there's an error, reject the Promise
            } else {
                console.log(results);
                resolve(results); // If successful, resolve the Promise with the results
            }
        });
    });
}

function addData(req, res) {
    const userId = req.session.userID;
    const { category, debitAmount, date, notes } = req.body;

    let tableName = '';
    switch (category) {
        case 'expenses':
            tableName = 'expenses';
            break;
        case 'emi':
            addEmi(req, res);
            return;
        case 'investment':
            tableName = 'investments';
            break;
        case 'subscription':
            tableName = 'subscriptions';
            break;
        default:
            tableName = 'budgets';
            break;
    }

    const sql = `INSERT INTO ?? (userID, category, debitAmount, date, notes) VALUES (?, ?, ?, ?, ?)`;

    con.query(sql, [tableName, userId, category, debitAmount, date, notes], (err, result) => {
        if (err) {
            res.send("Database error while adding data");
        } else {
            res.send("Data added successfully");
        }
    });
}

function addEmi(req, res) {
    const userId = req.session.userID;
    const { emiName, amount, dueDate, renewalPeriod, reminder, note } = req.body;
    const emiId=1;
 

    const sql = `INSERT INTO emis (userID, categoryID,emiName,amount,dueDate, renewalPeriod, reminderOn, notes) VALUES (?, 4, ?, ?, ?,?,?,?)`;
    con.query(sql, [userId,emiName, amount, dueDate, renewalPeriod, reminder, note], (err, result) => {
        if (err) throw err;
        res.send('EMI entry successfully added to emis table');
    });
}
function addInvest(req,res){
    const userId = req.session.userID;
    const { investmentName, amount, purchaseDate } = req.body;
    
    const investmentID=1;
    const currentValue=amount +(Math.random()*100);
    const sql = `INSERT INTO investments (investmentID,userID,categoryID,investmentName, amount, purchaseDate,currentValue) VALUES (?, ?, 3,?,?,?,?)`;
    con.query(sql, [investmentID+1,userId,investmentName, amount, purchaseDate,currentValue], (err, result) => {
        if (err){
            throw err;
        }else {
            res.send('Investment entry successfully added to investments table');
            
            
        }
        
    });

}

function addSub(req,res){
    const userId = req.session.userID;
    const { subscriptionName, amount, startDate, endDate, renewalPeriod, reminderOn, note } = req.body;
    const subId=0;
 
    const sql = `INSERT INTO subscriptions (subscriptionID,userID,categoryID,subscriptionName, amount, startDate, endDate, renewalPeriod, reminderOn, notes) 
                     VALUES (?, ?, 6, ?, ?, ?, ?,?,?,?)`;
    
    con.query(sql, [subId+1,userId,subscriptionName, amount, startDate, endDate, renewalPeriod, reminderOn, note], (err, result) => {
            if (err) {
                console.error("Error inserting subscription: ", err);
                res.status(500).send("An error occurred");
            } else {
                res.send('subscription added successfully '); // Redirect to the subscriptions page
            }
    });
    

}

function display(req, res) {
    const query = `
        SELECT 
            COUNT(*) AS investmentCount, 
            SUM(amount) AS totalInvestedAmount 
        FROM investments 
        WHERE userID = ?`;

    const userId = req.session.userID;

    if (!userId) {
        res.status(400).send("User ID not found in session.");
        return;
    }

    con.query(query, [userId], (error, results) => {
        if (error) {
            console.error('Error executing query:', error);
            res.status(500).send('Internal Server Error');
            return;
        }

        if (results.length > 0) {
            const investmentCount = results[0].investmentCount || 0;
            const totalInvestedAmount = results[0].totalInvestedAmount || 0.0;

            res.render('dashboard', { 
                session: req.session,
                investmentCount, 
                totalInvestedAmount 
            });
        } else {
            res.render('dashboard', { 
                session: req.session,
                investmentCount: 0, 
                totalInvestedAmount: 0.0 
            });
        }
    });
}

function displayEMI(req,res){
    const userId = req.session.userID;
    const query = `SELECT COUNT(*) AS pending_emis FROM emis WHERE status = 'due' AND userID = ?`;

    con.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching pending EMIs:', err);
            res.status(500).json({ error: 'Failed to retrieve pending EMIs' });
        } else {
            res.json({ pending_emis: results[0].pending_emis });
        }
    });
}

function getDebit(req,res){
    const userId = req.session.userID;
    const query = `
        SELECT
            (SELECT IFNULL(SUM(amount), 0) FROM emis WHERE userID = ?) +
            (SELECT IFNULL(SUM(amount), 0) FROM expenses WHERE userID = ?) +
            (SELECT IFNULL(SUM(amount), 0) FROM subscriptions WHERE userID = ?) +
            (SELECT IFNULL(SUM(amount), 0) FROM investments WHERE userID = ?) AS total_debit;
    `;

    con.query(query, [userId, userId, userId, userId], (err, results) => {
        if (err) {
            console.error('Error calculating total debit:', err);
            res.status(500).json({ error: 'Failed to calculate total debit amount' });
        } else {
            res.json({ total_debit: results[0].total_debit });
        }
    });
}


function updateStatus(req,res){
  
  const userId = req.session.userID;
  const { emiId} = req.body;

  const query = 'UPDATE emis SET status = ? WHERE emiID = ? AND userID= ?';
  con.query(query, ['Paid', emiId, userId], (err, result) => {
    if (err) throw err;
    if (result.affectedRows > 0) {
      res.json({ success: true });
    } else {
      res.json({ success: false, message: 'No record found or unauthorized' });
    }
  });
}

function getEmi(req,res){
    const userId = req.session.userID;
    const query = 'SELECT emiID AS emiID, emiName, amount, dueDate, notes, status FROM emis WHERE userID = ?';
    con.query(query, [userId], (err, results) => {
      if (err) throw err;
      console.log(results);
      res.render('emis', { emis: results, userId: userId });
    });

}



module.exports = {
    doLogin,
    registerUser,
    changePassword,
    forgotPassword,
    getData,
    addEmi,
    addInvest,
    addSub,
    addData,
    updateStatus,
    getEmi,
    displayEMI,
    getDebit,
    display // Ensure display is included here
};