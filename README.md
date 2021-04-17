# AsgardExchange

This project was generated with [Angular CLI](https://github.com/angular/angular-cli).
For component styling we are using [Angular Material](https://material.angular.io/) and [Tailwind](https://tailwindcss.com/docs).

## Development server

Create a `.env` file with a `ETHERSCAN_KEY`, and `INFURA_PROJECT_ID`. 
Run `npm run start` for local dev. This will build out the `src/environments` folder and start a local server.
Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.
After your environments folder is build out, running `ng serve` will work fine.

## Locking the app

In the case of emergency issues, you can lock up THORChain swaps, deposits, and withdraws. Simply set `APP_LOCKED` in your env to true. Users will still have access to external wallet transfer features, but THORChain features will be locked.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
