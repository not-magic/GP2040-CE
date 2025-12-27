#ifndef _AnalogToDpad_H
#define _AnalogToDpad_H

#include "gpaddon.h"

#include "GamepadEnums.h"

#ifndef ANALOG_TO_DPAD_ENABLED
#define ANALOG_TO_DPAD_ENABLED 0
#endif

#ifndef ANALOG_TO_DPAD_DEADZONE
#define ANALOG_TO_DPAD_DEADZONE 30
#endif

#ifndef ANALOG_TO_DPAD_SQUARENESS
#define ANALOG_TO_DPAD_SQUARENESS 10
#endif

#ifndef ANALOG_TO_DPAD_SLOPE
#define ANALOG_TO_DPAD_SLOPE 20
#endif

#ifndef ANALOG_TO_DPAD_OFFSET
#define ANALOG_TO_DPAD_OFFSET 20
#endif

#ifndef ANALOG_TO_DPAD_DEBOUNCE
#define ANALOG_TO_DPAD_DEBOUNCE 5
#endif

class AnalogToDpad : public GPAddon {
public:
	virtual std::string name() { return "Analog To D-pad"; }

	bool available() override;
	void setup() override;
	void process() override;
	void preprocess() override;
private:

	int8_t calc_cardinal(float axis, float other_axis, float debounce) const;

	// options
	float _squareness = ANALOG_TO_DPAD_SQUARENESS * 0.01f;
	float _slope = ANALOG_TO_DPAD_SLOPE * 0.01f;
	float _debounce = ANALOG_TO_DPAD_DEBOUNCE * 0.01f;
	float _deadzone = ANALOG_TO_DPAD_DEADZONE * 0.01f;
	float _offset = ANALOG_TO_DPAD_OFFSET * 0.01f;

	uint8_t _lastDpad = 0;

	GamepadButtonMapping *mapAnalogToDpad = nullptr;
};

#endif  // _AnalogToDpad_H
