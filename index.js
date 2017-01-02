/*
{
    "bridge": {
    	...
    },

    "description": "...",

    "accessories": [
        {
            "accessory": "Thermostat",
            "name": "Thermostat Demo",
            "apiroute": "http://myurl.com",
            //optional
            "maxTemp": "26",
            "minTemp": "15",
            "username": "user",
            "password": "pass"
        }
    ],

    "platforms":[]
}

*/



var Service, Characteristic;
var request = require("request");

module.exports = function(homebridge){
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory("homebridge-thermostat", "Thermostat", Thermostat);
};


function Thermostat(log, config) {
	this.log = log;
	this.maxTemp = config.maxTemp || 25;
	this.minTemp = config.minTemp || 15;
	this.name = config.name;
	this.apiroute = config.apiroute || "apiroute";
	this.log(this.name, this.apiroute);
	this.username = config.username || null;
	this.password = config.password || null;
	
	if(this.username != null && this.password != null){
		this.auth = {
			user : this.username,
			pass : this.password
		};
	}

	//Characteristic.TemperatureDisplayUnits.CELSIUS = 0;
	//Characteristic.TemperatureDisplayUnits.FAHRENHEIT = 1;
	this.temperatureDisplayUnits = Characteristic.TemperatureDisplayUnits.CELSIUS;
	this.currentTemperature = 19;
	this.currentRelativeHumidity = 0.70;
	// The value property of CurrentHeatingCoolingState must be one of the following:
	//Characteristic.CurrentHeatingCoolingState.OFF = 0;
	//Characteristic.CurrentHeatingCoolingState.HEAT = 1;
	//Characteristic.CurrentHeatingCoolingState.COOL = 2;
	this.heatingCoolingState = Characteristic.CurrentHeatingCoolingState.AUTO;
	this.targetTemperature = 21;
	this.targetRelativeHumidity = 0.5;
	this.heatingThresholdTemperature = 25;
	this.coolingThresholdTemperature = 5;
	// The value property of TargetHeatingCoolingState must be one of the following:
	//Characteristic.TargetHeatingCoolingState.OFF = 0;
	//Characteristic.TargetHeatingCoolingState.HEAT = 1;
	//Characteristic.TargetHeatingCoolingState.COOL = 2;
	//Characteristic.TargetHeatingCoolingState.AUTO = 3;
	this.targetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.AUTO;

	this.service = new Service.Thermostat(this.name);

}

Thermostat.prototype = {
	//Start
	identify: function(callback) {
		this.log("Identify requested!");
		callback(null);
	},
	// Required
	getCurrentHeatingCoolingState: function(callback) {
		this.currentHeatingCoolingState = 1;
		this.service.setCharacteristic(Characteristic.CurrentHeatingCoolingState, this.currentHeatingCoolingState);
		callback(null, this.currentHeatingCoolingState);
	},
	getTargetHeatingCoolingState: function(callback) {
		callback(null, this.targetHeatingCoolingState); // success
	},
	setTargetHeatingCoolingState: function(value, callback) {
		if(value === undefined) {
			callback(); //Some stuff call this without value doing shit with the rest
		} else {
			this.log("setTargetHeatingCoolingState from/to:", this.targetHeatingCoolingState, value);
			
			var action;
			
			this.targetHeatingCoolingState = value;

			switch(value) {
				case Characteristic.TargetHeatingCoolingState.OFF:
				action = "/off";
				break;

				case Characteristic.TargetHeatingCoolingState.HEAT:
				action = "/comfort";
				break;
				
				case Characteristic.TargetHeatingCoolingState.AUTO:
				action = "/auto";
				break;
				
				case Characteristic.TargetHeatingCoolingState.COOL:
				action = "/no-frost";
				break;

				default:
				action = "/no-frost";
				this.log("Not handled case:", value);
				break;
			}
			
			callback(null);
		}
	},
	getCurrentTemperature: function(callback) {
		this.currentTemperature = 17.3;
		callback(null, this.currentTemperature); // success
	},
	getTargetTemperature: function(callback) {
		callback(null, this.targetTemperature); // success
	},
	setTargetTemperature: function(value, callback) {
		this.targetTemperature = value;
		callback(null);
	},
	getTemperatureDisplayUnits: function(callback) {
		this.log("getTemperatureDisplayUnits:", this.temperatureDisplayUnits);
		var error = null;
		callback(error, this.temperatureDisplayUnits);
	},
	setTemperatureDisplayUnits: function(value, callback) {
		this.log("setTemperatureDisplayUnits from %s to %s", this.temperatureDisplayUnits, value);
		this.temperatureDisplayUnits = value;
		var error = null;
		callback(error);
	},

	// Optional
	getCurrentRelativeHumidity: function(callback) {
		this.currentRelativeHumidity = 62.5;
		callback(null, this.currentRelativeHumidity); // success
	},
	getTargetRelativeHumidity: function(callback) {
		this.log("getTargetRelativeHumidity:", this.targetRelativeHumidity);
		var error = null;
		callback(error, this.targetRelativeHumidity);
	},
	setTargetRelativeHumidity: function(value, callback) {
		this.log("setTargetRelativeHumidity from/to :", this.targetRelativeHumidity, value);
		this.targetRelativeHumidity = value;
		var error = null;
		callback(error);
	},
/*	getCoolingThresholdTemperature: function(callback) {
		this.log("getCoolingThresholdTemperature: ", this.coolingThresholdTemperature);
		var error = null;
		callback(error, this.coolingThresholdTemperature);
	},
*/	getHeatingThresholdTemperature: function(callback) {
		this.log("getHeatingThresholdTemperature :" , this.heatingThresholdTemperature);
		var error = null;
		callback(error, this.heatingThresholdTemperature);
	},
	getName: function(callback) {
		this.log("getName :", this.name);
		var error = null;
		callback(error, this.name);
	},

	getServices: function() {

		// you can OPTIONALLY create an information service if you wish to override
		// the default values for things like serial number, model, etc.
		var informationService = new Service.AccessoryInformation();

		informationService
			.setCharacteristic(Characteristic.Manufacturer, "HTTP Manufacturer")
			.setCharacteristic(Characteristic.Model, "HTTP Model")
			.setCharacteristic(Characteristic.SerialNumber, "HTTP Serial Number");

		

		// Required Characteristics
		this.service
			.getCharacteristic(Characteristic.CurrentHeatingCoolingState)
			.on('get', this.getCurrentHeatingCoolingState.bind(this));

		this.service
			.getCharacteristic(Characteristic.TargetHeatingCoolingState)
			.on('get', this.getTargetHeatingCoolingState.bind(this))
			.on('set', this.setTargetHeatingCoolingState.bind(this));

		this.service
			.getCharacteristic(Characteristic.CurrentTemperature)
			.on('get', this.getCurrentTemperature.bind(this));

		this.service
			.getCharacteristic(Characteristic.TargetTemperature)
			.on('get', this.getTargetTemperature.bind(this))
			.on('set', this.setTargetTemperature.bind(this));

		this.service
			.getCharacteristic(Characteristic.TemperatureDisplayUnits)
			.on('get', this.getTemperatureDisplayUnits.bind(this))
			.on('set', this.setTemperatureDisplayUnits.bind(this));

		// Optional Characteristics
		this.service
			.getCharacteristic(Characteristic.CurrentRelativeHumidity)
			.on('get', this.getCurrentRelativeHumidity.bind(this));

		this.service
			.getCharacteristic(Characteristic.TargetRelativeHumidity)
			.on('get', this.getTargetRelativeHumidity.bind(this))
			.on('set', this.setTargetRelativeHumidity.bind(this));
		/*
		this.service
			.getCharacteristic(Characteristic.CoolingThresholdTemperature)
			.on('get', this.getCoolingThresholdTemperature.bind(this));
		*/

		this.service
			.getCharacteristic(Characteristic.HeatingThresholdTemperature)
			.on('get', this.getHeatingThresholdTemperature.bind(this));

		this.service
			.getCharacteristic(Characteristic.Name)
			.on('get', this.getName.bind(this));
		this.service.getCharacteristic(Characteristic.CurrentTemperature)
			.setProps({
				minValue: this.minTemp,
				maxValue: this.maxTemp,
				minStep: 1
			});
		this.service.getCharacteristic(Characteristic.TargetTemperature)
			.setProps({
				minValue: this.minTemp,
				maxValue: this.maxTemp,
				minStep: 1
			});
		this.log(this.minTemp);
		return [informationService, this.service];
	}
};
