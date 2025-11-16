const Encore = require('@symfony/webpack-encore');
const webpack = require('webpack'); // 1. Zachowujemy import modułu Webpack

// Manually configure the runtime environment if not already configured yet by the "encore" command.
// It's useful when you use tools that rely on webpack.config.js file.
if (!Encore.isRuntimeEnvironmentConfigured()) {
    Encore.configureRuntimeEnvironment(process.env.NODE_ENV || 'dev');
}

Encore
    // directory where compiled assets will be stored
    .setOutputPath('public/build/')
    // public path used by the web server to access the output path
    .setPublicPath('/build')
    
    .addEntry('app', './assets/js/app.js')
    .splitEntryChunks()
    .enableSingleRuntimeChunk()

    /*
     * FEATURE CONFIG
     */
    .cleanupOutputBeforeBuild()
    .enableBuildNotifications()
    .enableSourceMaps(!Encore.isProduction())
    .enableVersioning(Encore.isProduction())

    // configure Babel
    // 2. Używamy .configureBabel, aby ustawić 'classic' runtime
    .configureBabel((config) => {
        // Znajdź preset Reacta dodany przez .enableReactPreset()
        config.presets.forEach(preset => {
            if (Array.isArray(preset) && preset[0].includes('@babel/preset-react')) {
                // Wymuś 'classic' runtime
                preset[1] = { ...preset[1], runtime: 'classic' };
            }
        });
    })

    // enables and configure @babel/preset-env polyfills
    .configureBabelPresetEnv((config) => {
        config.useBuiltIns = 'usage';
        config.corejs = '3.23';
    })

    // enables Sass/SCSS support
    //.enableSassLoader()

    // uncomment if you use TypeScript
    //.enableTypeScriptLoader()

    // uncomment if you use React
    // 3. Wracamy do prostego wywołania, które nie przerywa łańcucha
    .enableReactPreset()
    
    // 4. POPRAWIONA SKŁADNIA: Używamy .addPlugin() zamiast .configure()
    // Wstrzykujemy React jako globalną zmienną (naprawia ReferenceError: React is not defined)
    .addPlugin(new webpack.ProvidePlugin({
        React: 'react',
    }))

    // uncomment to get integrity="..." attributes on your script & link tags
    //.enableIntegrityHashes(Encore.isProduction())

    // uncomment if you're having problems with a jQuery plugin
    //.autoProvidejQuery()
;

module.exports = Encore.getWebpackConfig();