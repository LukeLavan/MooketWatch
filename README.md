# MooketWatch

For now this does little more than test out the Milky Way Idle Market API, which can be found at
[@holychikenz/MWIApi](https://github.com/holychikenz/MWIApi).

## Getting Started

After cloning the repo, `cd` into the directory and run:

```bash
npm install
```

After that is completed, you'll be able to run the commands below.

### Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The
application will automatically reload whenever you modify any of the source files.

### Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default,
the production build optimizes your application for performance and speed.

## Overview

This is an Angular app that uses [sql.js](https://github.com/sql-js/sql.js) to be able to run
queries on the `.db` file that the Milky Way Idle Market API provides. It also uses
[Chart.js](https://github.com/chartjs/Chart.js) to visualize the data.

### Mooket Data

The data provided by the Milky Way Idle Market API is very raw. If data is missing for a given item,
it is recorded as having a value of -1 for that timestamp. Also, the dataset is very prone to
outliers that correspond to in-game market conditions - eg, when the asking price of a given item is
hiked up because there's only one item available to purchase. This app will hopefully work to clean
up the data before visualization - for now a min/max threshold can be set per line and if the value
falls outside the given range that data point is treated as if it were missing.

## Roadmap

I'm just tinkering with this for now, but if there's sufficient motivation/interest I'd like to make
this a usable tool for looking at market trends. The UI needs a lot of work but the goal is to
support plotting user-input expressions without expecting the user to write any SQL; eventually with
a helpful UI to facilitate writing those expression strings and maybe even some useful recipes
baked-in as presets. The next immediate goal is to make the UI not ugly.

## Contributing

Feel free to open issues/branches/PRs/forks/whatever or reach out directly for any suggestions or
feedback! The more activity this gets the more I'll contribute to it.
