const express = require('express');
const myApp = express();
const port = 3002;
const path = require('path');
const session = require('express-session');
const dbUse = require('./dbCon/connection');
const bodyParser = require('body-parser');
const dashboard = require('./routes/dashboard');  // Updated path

// Set up body-parser middleware
myApp.use(bodyParser.urlencoded({ extended: true }));
myApp.use(bodyParser.json());

myApp.use(
    session({
        secret: 'secret',
        resave: true,
        saveUninitialized: true
    })
)

/* check Login status middleware */
chkLogin = (req, res, next) => {
    if (req.session.hasOwnProperty('loggedIn') && req.session.loggedIn == true) {
        next();
    } else res.redirect("/login");
}

/* view engine setup */
myApp.set('views', path.join(__dirname, 'views'));
myApp.set('view engine', 'ejs');

myApp.get('/', chkLogin, (req, res) => {
    res.redirect('/dashboard');
})

/*Dashboard section */
myApp.use('/dashboard', chkLogin, dashboard);

// To get method for login
myApp.get('/login', (req, res) => {
    res.render('login', { session: req.session });
})

// To post method for login
myApp.post('/login', (req, res) => {
    dbUse.doLogin(req, res);
});

// Route for register
myApp.post('/register', (req, res) => {
    dbUse.registerUser(req, res);
});

// Change Password routes
myApp.get('/changepassword', chkLogin, (req, res) => {
    res.render('changepassword', { session: req.session });
});

myApp.post('/changepassword', chkLogin, (req, res) => {
    dbUse.changePassword(req, res);
});

// Forgot Password routes
myApp.get('/forgotpassword', (req, res) => {
    res.render('forgotpassword', { session: req.session });
});

myApp.post('/forgotpassword', (req, res) => {
    dbUse.forgotPassword(req, res);
});


myApp.get('/register', (req, res) => {
    res.render('register'); 
});

myApp.get('/subscriptions',(req,res)=>{
    res.render('subscriptions');
});

myApp.get('/debit-form', (req, res) => {
    res.render('debitForm');
});

myApp.post('/submit-debit', (req, res) => {
    dbUse.addData(req,res);
});

myApp.get('/emi-form', (req, res) => {
    res.render('emiForm');
});

myApp.post('/submit-emi', (req, res) => {
    dbUse.addEmi(req,res);
});

myApp.get('/investment-form', (req, res) => {
    res.render('investmentForm');
});

myApp.post('/submit-investment', (req, res) => {
    dbUse.addInvest(req,res);
});

myApp.get('/subscription-form', (req, res) => {
    res.render('subscriptionForm');
});

myApp.get('/dashboard', (req, res) => {
    dbUse.display(req,res);
});

myApp.post('/submit-subscription', (req, res) => {
    dbUse.addSub(req,res);
});

myApp.post('/changeStatus', (req, res) => {
    dbUse.updateStatus(req,res);
    
});

myApp.get('/api/pending-emis/:userId', (req, res) => {
    dbUse.displayEMI(req,res);
});

myApp.get('/api/total-debit/:userId', (req, res) => {
    dbUse.getDebit(req,res);
});





// Logout route
myApp.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/dashboard');
        }
        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
});

myApp.listen(port, () => {
    console.log(`Your server is running on http://localhost:${port}`);
})