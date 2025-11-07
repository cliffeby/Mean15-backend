"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const morgan_1 = require("morgan");
const helmet_1 = require("helmet");
const cors_1 = require("cors");
const express_rate_limit_1 = require("express-rate-limit");
const cookie_parser_1 = require("cookie-parser");
const compression_1 = require("compression");
const errorHandler_js_1 = require("./middleware/errorHandler.js");
const authRoutes_js_1 = require("./routes/authRoutes.js");
const customerRoutes_js_1 = require("./routes/customerRoutes.js");
const loanRoutes_js_1 = require("./routes/loanRoutes.js");
const offerRoutes_js_1 = require("./routes/offerRoutes.js");
const contactRoutes_js_1 = require("./routes/contactRoutes.js");
const memberRoutes_js_1 = require("./routes/memberRoutes.js");
const userRoutes_js_1 = require("./routes/userRoutes.js");
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
app.use((0, cookie_parser_1.default)());
app.use((0, compression_1.default)());
if (process.env.NODE_ENV === 'development') {
    app.use((0, morgan_1.default)('dev'));
}
else {
    app.use((0, morgan_1.default)('combined'));
}
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use(limiter);
// Mount API routes
app.use('/api/auth', authRoutes_js_1.default);
app.use('/api/customers', customerRoutes_js_1.default);
app.use('/api/loans', loanRoutes_js_1.default);
app.use('/api/offers', offerRoutes_js_1.default);
app.use('/api/contact', contactRoutes_js_1.default);
app.use('/api/members', memberRoutes_js_1.default);
app.use('/api/users', userRoutes_js_1.default);
// healthcheck
app.get('/', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); // allow all origins
    res.json({ status: 'ok', env: process.env.NODE_ENV || 'development' });
});
// error handler (last)
app.use(errorHandler_js_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map