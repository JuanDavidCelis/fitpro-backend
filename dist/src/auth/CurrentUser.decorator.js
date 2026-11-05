"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentUser = void 0;
const common_1 = require("@nestjs/common");
/**
 * Uso: async miEndpoint(@CurrentUser() user: VerifiedIdentity) { ... }
 * Requiere que Supabase AuthAuthGuard ya haya corrido antes en la cadena de
 * guards (adjunta req.user).
 */
exports.CurrentUser = (0, common_1.createParamDecorator)((_data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
});
