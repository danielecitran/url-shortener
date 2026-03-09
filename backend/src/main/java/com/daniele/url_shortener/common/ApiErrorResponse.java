package com.daniele.url_shortener.common;

public record ApiErrorResponse(
        String code,
        String message
) {
}
