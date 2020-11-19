var cc = DataStudioApp.createCommunityConnector();

/**
 * isAdminUser
 * function for debugging purposes
 * @returns {Boolean}
 */
function isAdminUser() {
  return false;
}

/**
 * getAuthType
 * function gets the authType required for connector
 * @returns {Object}
 */
function getAuthType() {
  var AuthTypes = cc.AuthType;
  return cc
    .newAuthTypeResponse()
    .setAuthType(AuthTypes.NONE)
    .build();
}

/**
 * getConfig
 * function gets the config required for connector
 * @param {Object} request
 * @returns {Object} build
 */
function getConfig(request) {
  var config = cc.getConfig();

  config
    .newInfo()
    .setId("instructions")
    .setText("Configuration");

  config
    .newTextInput()
    .setId("api_key")
    .setName("API key")
    .setHelpText("Your API key is available on the Admin > Teams page")
    .setPlaceholder("your-api-key");

  config
    .newInfo()
    .setId("parameters")
    .setText("Parameters");

  config
    .newSelectSingle()
    .setId("days")
    .setName("Days")
    .setHelpText("Select the number of days for the data range")
    .addOption(
      config
        .newOptionBuilder()
        .setLabel("3")
        .setValue("3")
    )
    .addOption(
      config
        .newOptionBuilder()
        .setLabel("7")
        .setValue("7")
    )
    .addOption(
      config
        .newOptionBuilder()
        .setLabel("30")
        .setValue("30")
    )
    .addOption(
      config
        .newOptionBuilder()
        .setLabel("90")
        .setValue("90")
    )
    .setAllowOverride(true);

  config
    .newSelectSingle()
    .setId("browser")
    .setName("Browser")
    .setHelpText("Select the browser for the data")
    .addOption(
      config
        .newOptionBuilder()
        .setLabel("Chrome")
        .setValue("chrome")
    )
    .addOption(
      config
        .newOptionBuilder()
        .setLabel("iPhone 5")
        .setValue("apple-iphone-5")
    )
    .setAllowOverride(true);

  config
    .newSelectSingle()
    .setId("region")
    .setName("Region")
    .setHelpText("Select the region for the data")
    .addOption(
      config
        .newOptionBuilder()
        .setLabel("Germany")
        .setValue("eu-central-1")
    )
    .addOption(
      config
        .newOptionBuilder()
        .setLabel("England")
        .setValue("eu-west-2")
    )
    .setAllowOverride(true);

  return config.build();
}

/**
 * getFields
 * function gets the fieldsuired for connector
 * @param {Object} request
 * @returns {Object} fields
 */

function getFields(request) {
  var cc = DataStudioApp.createCommunityConnector();
  var fields = cc.getFields();
  var types = cc.FieldType;
  var aggregations = cc.AggregationType;

  fields
    .newDimension()
    .setId("day")
    .setType(types.YEAR_MONTH_DAY);

  fields
    .newDimension()
    .setId("browser")
    .setType(types.TEXT);

  fields
    .newDimension()
    .setId("js_size")
    .setType(types.NUMBER);

  fields
    .newDimension()
    .setId("image_size")
    .setType(types.NUMBER);

  fields
    .newDimension()
    .setId("css_size")
    .setType(types.NUMBER);

  fields
    .newDimension()
    .setId("html_size")
    .setType(types.NUMBER);

  fields
    .newDimension()
    .setId("font_size")
    .setType(types.NUMBER);

  fields
    .newDimension()
    .setId("time_to_interactive")
    .setType(types.NUMBER);

  fields
    .newDimension()
    .setId("first_contentful_paint")
    .setType(types.NUMBER);

  return fields;
}

/**
 * getSchema
 * function gets the schema for connector
 * @param {Object} request
 * @returns {Object} schema
 */

function getSchema(request) {
  var fields = getFields(request).build();
  return { schema: fields };
}

/**
 * responseToRows
 * function to transform the parsed data and filter it down for requested fields
 * @param {Object} requestedFields
 * @param {Object} response
 * @returns {Object} row
 */

function responseToRows(requestedFields, response) {
  return response.map(function(tests) {
    var row = [];
    requestedFields.asArray().forEach(function(field) {
      switch (field.getId()) {
        case "day":
          return row.push(tests.day.replace(/-/g, ""));
        case "browser":
          return row.push(tests["browser"]);
        case "js_size":
          return row.push(tests["js_size"]);
        case "image_size":
          return row.push(tests["image_size"]);
        case "css_size":
          return row.push(tests["css_size"]);
        case "html_size":
          return row.push(tests["html_size"]);
        case "font_size":
          return row.push(tests["font_size"]);
        case "first_contentful_paint":
          return row.push(tests["first_contentful_paint"]);
        case "time_to_interactive":
          return row.push(tests["time_to_interactive"]);
        default:
          return row.push("");
      }
    });
    return { values: row };
  });
}

/**
 * getEncodedAPIKey
 * function encodes a string to base64
 * @param {String} key
 */
function getEncodedAPIKey(key) {
  var blob = Utilities.newBlob(key + ":x");
  return Utilities.base64Encode(blob.getBytes());
}

/**
 * getData
 * function takes request from DS and makes
 * network request to endpoint
 * @param {Object} request
 * @returns {Object} data
 */

function getData(request) {
  if (request.configParams["url_id"] === undefined) {
    cc.newUserError()
      .setText("Please add a parameter with id 'url_id' for your urls.")
      .throwException();
  }

  // Fetch and parse data from API
  var url = [
    "https://api.speedcurve.com/v1/urls/",
    request.configParams["url_id"],
    "?",
    "days=" + request.configParams["days"],
    "&",
    "browser=" + request.configParams["browser"],
    "&",
    "region=" + request.configParams["region"],
  ];

  var encodedKey = getEncodedAPIKey(request.configParams["api_key"]);

  var options = {
    headers: {
      Authorization: "Basic " + encodedKey,
    },
  };

  var response = UrlFetchApp.fetch(url.join(""), options);
  var parsedResponse = JSON.parse(response).tests;

  var requestedFields = getFields().forIds(
    request.fields.map(function(field) {
      return field.name;
    })
  );

  var rows = responseToRows(requestedFields, parsedResponse);

  return {
    schema: requestedFields.build(),
    rows: rows,
  };
}
