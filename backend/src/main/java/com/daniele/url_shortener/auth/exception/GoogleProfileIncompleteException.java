package com.daniele.url_shortener.auth.exception;

public class GoogleProfileIncompleteException extends RuntimeException {

    public GoogleProfileIncompleteException(String message) {
        super(message);
    }
}
