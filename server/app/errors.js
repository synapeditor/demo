// Error responses carry a fixed code and a short message only. The underlying error (the
// converter command, work paths, multer and busboy stack traces) goes to the server log,
// never to the caller: /importDoc and the upload routes answer unauthenticated requests.

function sendError(res, status, code, message) {
    res.status(status).json({ code: code, error: message });
}

// Express answers an unmatched path with an HTML page that names the method and path.
function notFound(req, res) {
    sendError(res, 404, 'NOT_FOUND', 'Not found');
}

// Without this, Express's own handler prints the stack trace into the response body.
function errorHandler(err, req, res, next) {
    console.error('[editor-demo] unhandled error:', err);

    if (res.headersSent) {
        return next(err);
    }

    const status = err.status || err.statusCode;

    if (status >= 400 && status < 500) {
        return sendError(res, status, 'BAD_REQUEST', 'Bad request');
    }

    sendError(res, 500, 'INTERNAL_ERROR', 'Internal error');
}

module.exports = {
    sendError,
    notFound,
    errorHandler
};
