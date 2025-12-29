#ifndef _AnalogToDpad_H
#define _AnalogToDpad_H

#include "gpaddon.h"

#include "GamepadEnums.h"

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
