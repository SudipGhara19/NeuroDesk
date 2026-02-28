const errorMiddleware = (err, req, res, next) => {
    console.error(`❌ Error: ${err.message}`);
    
    // Default status code is 500
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    
    res.status(statusCode).json({
        message: err.message || 'Internal Server Error',
        stack: process.env.NODE_ENV === 'development' ? err.stack : {}
    });
};

module.exports = errorMiddleware;
