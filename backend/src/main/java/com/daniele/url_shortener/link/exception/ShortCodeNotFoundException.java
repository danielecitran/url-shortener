package com.daniele.url_shortener.link.exception;

public class ShortCodeNotFoundException extends RuntimeException {

    public ShortCodeNotFoundException(String message) {
        super(message);
    }
}
