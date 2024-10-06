const express = require('express');
var router = express.Router();
var session = require('express-session');
var dbUse = require('../dbCon/connection.js');
const bodyParser = require('body-parser');

// Middleware to check login status
chkLogin = (req, res, next) => {
    if (req.session.loggedIn) {
        next();
    } else {
        res.redirect("/login");
    }
};

// Main dashboard route with investments and total invested amount
router.get('/dashboard', chkLogin, (req, res) => {
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

    dbUse.query(query, [userId], (error, results) => {
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
});

// Other routes
router.get('/expenses', chkLogin, (req, res) => {
    dbUse.getData(req, 'expenses')
        .then(data => res.render('expenses', { expenses: data }))
        .catch(err => {
            console.error('Error fetching expenses:', err);
            res.status(500).send('An error occurred while fetching expenses data.');
        });
});

router.get('/savingsgoals', chkLogin, (req, res) => {
    dbUse.getData(req, 'savingsgoals')
        .then(data => res.render('savingsgoals', { savingsgoals: data }))
        .catch(err => {
            console.error('Error fetching savings goals:', err);
            res.status(500).send('An error occurred while fetching savings goals data.');
        });
});

router.get('/financialreports', chkLogin, (req, res) => {
    dbUse.getData(req, 'financialreports')
        .then(data => res.render('financialreports', { financialreports: data }))
        .catch(err => {
            console.error('Error fetching financial reports:', err);
            res.status(500).send('An error occurred while fetching financial reports data.');
        });
});

router.get('/billreminders', chkLogin, (req, res) => {
    dbUse.getData(req, 'billreminders')
        .then(data => res.render('billreminders', { billreminders: data }))
        .catch(err => {
            console.error('Error fetching bill reminders:', err);
            res.status(500).send('An error occurred while fetching bill reminders data.');
        });
});

router.get('/investments', chkLogin, (req, res) => {
    dbUse.getData(req, 'investments')
        .then(data => res.render('investments', { investments: data }))
        .catch(err => {
            console.error('Error fetching investments:', err);
            res.status(500).send('An error occurred while fetching investments data.');
        });
});

router.get('/emis', chkLogin, (req, res) => {
    dbUse.getEmi(req,res)
});

router.get('/subscriptions', chkLogin, (req, res) => {
    dbUse.getData(req, 'subscriptions')
        .then(data => res.render('subscriptions', { subscriptions: data }))
        .catch(err => {
            console.error('Error fetching subscriptions:', err);
            res.status(500).send('An error occurred while fetching subscriptions data.');
        });
});

router.get('/form', chkLogin, (req, res) => {
    res.render('form.ejs');
});

router.get('/debitForm', chkLogin, (req, res) => {
    res.render('debitForm.ejs');
});

router.get('/emi-form', chkLogin, (req, res) => {
    res.render('emiForm.ejs');
});

router.get('/investment-form', chkLogin, (req, res) => {
    res.render('investmentForm.ejs');
});

router.get('/subscription-form', chkLogin, (req, res) => {
    res.render('subscriptionForm.ejs');
});

router.get('/getTotalAmount/:userID', (req, res) => {
    const userID = req.params.userID;

    const sql = `SELECT SUM(totalAmount) AS totalAmount FROM budgets WHERE userID = ?`;

    dbUse.query(sql, [userID], (err, result) => {
        if (err) {
            console.error("Error fetching total amount: ", err);
            res.status(500).send("An error occurred");
        } else {
            res.json(result[0].totalAmount);
        }
    });
});



module.exports = router;
