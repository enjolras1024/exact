
module.exports = function(config) {
  config.set({
    basePath: '',
//    autoWatch: true,
    frameworks: ['mocha', 'chai'],
    files: [
      // src
      'src/skins/Skin.js',

      'src/entry-exit.js',

      'src/utils/PathUtil.js',
      'src/utils/StringUtil.js',
      'src/utils/LiteralUtil.js',

      'src/share/constants.js',
      'src/share/functions.js',
      'src/share/RES.js',

      'src/base/Watcher.js',
      'src/base/Accessor.js',
      'src/base/Schedule.js',
      'src/base/Validator.js',
      'src/base/Evaluator.js',
      'src/base/Expression.js',
      'src/base/DirtyMarker.js',

      'src/core/models/Store.js',
      'src/core/models/Container.js',
      'src/core/models/Collection.js',

      'src/core/shadows/Shadow.js',
      'src/core/shadows/Text.js',
      'src/core/shadows/Element.js',
      'src/core/shadows/Component.js',

      'src/core/bindings/Binding.js',
      'src/core/bindings/DataBinding.js',
      'src/core/bindings/TextBinding.js',
      'src/core/bindings/EventBinding.js',

      'src/core/template/HTMXEngine.js',
      'src/core/template/HTMXTemplate.js',

      'src/core/template/parsers/EvaluatorParser.js',
      'src/core/template/parsers/DataBindingParser.js',
      'src/core/template/parsers/EventBindingParser.js',
      'src/core/template/parsers/TextBindingParser.js',
      'src/core/template/parsers/HTMLParser.js',
      'src/core/template/parsers/HTMXParser.js',

      'src/exit.js',


      // test
      'test/share/functions.test.js',
      'test/share/RES.test.js',

      'test/utils/PathUtil.test.js',
      'test/utils/StringUtil.test.js',
      'test/utils/LiteralUtil.test.js',

      'test/base/Watcher.test.js',
      'test/base/Accessor.test.js',
      'test/base/Schedule.test.js',
      'test/base/Validator.test.js',
      'test/base/Evaluator.test.js',
      'test/base/Expression.test.js',
      'test/base/DirtyMarker.test.js',

      'test/core/bindings/Binding.test.js',

      'test/core/models/Store.test.js',
      'test/core/models/Container.test.js',
      'test/core/models/Collection.test.js',

      'test/core/shadows/Text.test.js',
      'test/core/shadows/Shadow.test.js',
      'test/core/shadows/Element.test.js',

      'test/core/template/HTMXTemplate.test.js',
      'test/core/template/parsers/HTMLParser.test.js',
      'test/core/template/parsers/HTMXParser.test.js',
      'test/core/template/parsers/EvaluatorParser.test.js',
      'test/core/template/parsers/DataBindingParser.test.js',
      'test/core/template/parsers/EventBindingParser.test.js',
      'test/core/template/parsers/TextBindingParser.test.js'
    ],
    plugins: [
        'karma-coverage',
        'karma-chai',
        'karma-mocha',
        'karma-mocha-reporter',
        'karma-chrome-launcher',
        'karma-phantomjs-launcher'
    ],

    browsers: ['PhantomJS'/*, 'Chrome'*/], // , 'Firefox'],

    reporters: [/*'progress', */'coverage', 'mocha'],
    preprocessors: { './src/**/*.js': ['coverage'] },

    singleRun: true,
    logLevel: config.LOG_INFO,
    colors: true,

//    mochaReporter: {
//      output: 'full'
//    },

    coverageReporter: {
        dir : 'reporters/coverage/',
        reporters: [
            { type: 'html', subdir: 'html' }//,
//            { type: 'lcovonly', subdir: 'lcov' },
//            { type: 'cobertura', subdir: 'cobertura' }
        ]
    }
  });
};
