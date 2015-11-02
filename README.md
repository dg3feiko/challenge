Node.js Testing Example with Aftership Challange
=============================

### Intro

Here I demonstrate some node.js testing techniques with `Aftership Challange`, including:

* different scope of tests: unit tests, integration tests, e2e(manual) tests
* mocking strategies: stub, mock, spy
* assertions: promise based assertion, bbd style, mocking assertions

### How to run tests

##### Unit Tests

`mocha test/unit/*`

##### Integration Tests

`mocha test/integration/*`

##### e2e

* start `mongodb` and `beanstalkd` on localhost
* `DEBUG=* node test/e2e/test.js` 