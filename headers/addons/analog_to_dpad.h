#ifndef _AnalogToDpad_H
#define _AnalogToDpad_H

#include "gpaddon.h"

#include "GamepadEnums.h"


#ifndef ANALOG_TO_DPAD_ENABLED
#define ANALOG_TO_DPAD_ENABLED 0
#endif

#ifndef ANALOG_TO_DPAD_SOURCE
#define ANALOG_TO_DPAD_SOURCE ANALOG_TO_DPAD_SOURCE_1
#endif

#ifndef ANALOG_TO_DPAD_8WAY_DEADZONE
#define ANALOG_TO_DPAD_8WAY_DEADZONE 50
#endif

#ifndef ANALOG_TO_DPAD_8WAY_SQUARENESS
#define ANALOG_TO_DPAD_8WAY_SQUARENESS 0
#endif

#ifndef ANALOG_TO_DPAD_8WAY_SLOPE
#define ANALOG_TO_DPAD_8WAY_SLOPE 20
#endif

#ifndef ANALOG_TO_DPAD_8WAY_OFFSET
#define ANALOG_TO_DPAD_8WAY_OFFSET 20
#endif

#ifndef ANALOG_TO_DPAD_8WAY_DEBOUNCE
#define ANALOG_TO_DPAD_8WAY_DEBOUNCE 5
#endif


#ifndef ANALOG_TO_DPAD_4WAY_DEADZONE
#define ANALOG_TO_DPAD_4WAY_DEADZONE 50
#endif

#ifndef ANALOG_TO_DPAD_4WAY_SQUARENESS
#define ANALOG_TO_DPAD_4WAY_SQUARENESS 0
#endif

#ifndef ANALOG_TO_DPAD_4WAY_OFFSET
#define ANALOG_TO_DPAD_4WAY_OFFSET 20
#endif

#ifndef ANALOG_TO_DPAD_4WAY_DEBOUNCE
#define ANALOG_TO_DPAD_4WAY_DEBOUNCE 5
#endif



class AnalogToDpadAddon : public GPAddon {
public:
	virtual std::string name() { return "Analog To D-pad"; }

	bool available() override;
	void reinit() override;
	void setup() override;
	void process() override;
	void preprocess() override;
	void postprocess(bool sent) override {}
private:

	uint8_t _lastDpad = 0;
	Mask_t _enablePinMask = 0;
	Mask_t _4wayPinMask = 0;
	bool _4wayMode = false;
};

#endif  // _AnalogToDpad_H
