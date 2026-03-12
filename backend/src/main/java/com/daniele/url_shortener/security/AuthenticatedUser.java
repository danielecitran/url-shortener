package com.daniele.url_shortener.security;

public record AuthenticatedUser(
        Long userId,
        String email
) {
}
