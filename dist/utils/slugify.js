"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeSlug = makeSlug;
function makeSlug(name) {
    const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "")
        .slice(0, 40);
    const rand = Math.random().toString(36).slice(2, 7);
    return `${slug}-${rand}`;
}
