module.exports.authorize = function(req, res, next) {

    console.log(req.session.userId);
    console.log(req.url);

    req.session.userId = 123;

    //res.status = 401;
    return next();// "DENIED");


}
