### Usage

Include `redaxtor.min.js` in your project. I.e. `/node_modules/redaxtor-spiral-bridge/redaxtor.min.js`
For development purposes incluse map file as well, i.e. `/node_modules/redaxtor-spiral-bridge/redaxtor.min.js`

See [`index.php`](./index.php) for typical Spiral Framework PHP usage sample.


### Node dependency usage in `package.json`

````json
    {
        "dependencies": {
            "redaxtor-spiral-bridge": "git@github.com:redaxtor/redaxtor-spiral-bridge.git#master"
        }
    }
````

### Updating during development

1. Install node
2. Update git submodules
3. Run `npm install` and `npm build`


### Publishing during development

1. Run `npm publish`
