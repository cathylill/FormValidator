/* Generic Form Validation */
jQuery.fn.validateForm = function (options) {
    var settings = jQuery.extend({
            eventTrigger : "both" // options are "both" or "submit"
        }, options || {}),
        tests,
        formValidation,
        eventCancel,
        isSubmit = false,
        i;
    
    //Included tests in JSON format. Additional custom tests may be included in plugin call.
    tests = {

        required : {                                   // Test name.
            lookup : "container",                      // Indicates that the identifier class name is on an ancestor container, not the the form field itself.
            identifier : "required",                   // Class name to identify the field / container.
            message : "This item is a required field", // Error message to display. 'This item' is replaced with the field label.
            submitStr : function (s) {                 // Conversion function to fix string before checking. Updated string will be inserted as the field value if validate test === true. Must return a string.
                return s;
            },
            validate : function (s, t) {               // Validation function. Must return true or false.
                return (s !== "");
            }
        },	
            
        trim : {
            identifier: "", 
            message : "",
            submitStr : function (s) {
                return s.replace(/(^\s*)|(\s*$)/g, "").replace(/(  +)|(\t)/g, " ");
            },
            validate : function (s, t) {
                return true;
            }
        },
                
        text : {
            identifier : "text",
            message : "This item may not contain script tags and must not exceed the character limit.",
            submitStr : function (s) {
                return s;
            },
            validate : function (s, t) {
                var testValue = this.submitStr(s),
                    testResult = (/[.\s]?<\s*\/?\s*script\s*>[.\s]?/i).test(testValue) ? false : true,
                    textMaxChar = 100,
                    textareaMaxChar = 1000,
                    currMaxChar = (t === "text") ? textMaxChar : (t === "textarea") ? textareaMaxChar : 100,
                    validCharLen = testValue.length <= currMaxChar;
        
                return (testResult && validCharLen) || s === "";
            }			
        },
        
        number : {
            identifier : "number",
            message : "This item may only contain numbers",
            submitStr : function (s) {
                return s.replace(/[\s,]+/g, "");
            },
            validate : function (s, t) {
                return (/^[^\D]*$/).test(this.submitStr(s)) || s === "";
            }
        },
        
        date : {
            identifier : "date",
            message : "This item is not a valid date. Dates must be between 1/1/1900 and 1/1/2100.",
            submitStr : function (s) {
                return s.replace(/[\-: ]/g, "/");
            },
            validate : function (s, t) {
                var testValue = this.submitStr(s), 
                    testResult = (/(^[0-3]?[0-9]\/[0-1]?[0-9]\/(\d{2}|\d{4})$)/).test(testValue),
                    currDay = testValue.split("/")[0],
                    currMonth = testValue.split("/")[1],
                    currDate = new Date(testValue.replace(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/, "$3, $2, $1")).getTime() || null,				
                    pastDateBoundary = new Date("January 1, 1900").getTime(),
                    futureDateBoundary = new Date("January 1, 2100").getTime(),
                    validDate = (currDay > 0 && currDay < 32 && currMonth > 0 && currMonth < 13  && currDate > pastDateBoundary && currDate < futureDateBoundary);
                
                return (validDate && testResult) || s === "";	
            }
        },
        
        time : {
            identifier : "time",
            message : "This item is not a valid time. Please use standard 24 hour time format hh:mm",
            submitStr : function (s) {
                return s.replace(/[\-\/\\ ]/g, ":");
            },
            validate : function (s, t) {
                var testValue = this.submitStr(s),
                    testResult = (/^[0-2]?[0-9]:[0-5][0-9]$/).test(testValue),
                    currHour = testValue.split(":")[0],
                    currMin = testValue.split(":")[1],
                    validTime = (currHour >= 0 && currHour <= 23 && currMin >= 0 && currMin <= 59);
                    
                return (validTime && testResult) || s === "";
            }
        },
        
        email : {
            identifier : "email",
            message : "This item must be a valid email address, eg 'user@mynet.com'.",
            submitStr : function (s) {
                return s;
            },
            validate : function (s, t) {
                return (/(^[\w\.]*@\w*\.\w{2,3}(\.\w{2,3})?$)/).test(s) || s === "";
            }
        },
        
        postcode : {
            identifier : "postcode",
            message : "This item must contain letters and numbers only and be less than 12 characters.",
            submitStr : function (s) {
                return s.replace(/[:\-]/g, "");
            },
            validate : function (s, t) {
                return (/^\w{1,4} ?\w{1,8}?$/).test(this.submitStr(s)) || s === "";		
            }
        },
        
        creditCardNum : {
            identifier : "cc-number",
            message : "This item must be between 13 and 16 digits only.",
            submitStr : function (s) {
                return s.replace(/[ :\-\\\/,]/g, "");
            },
            validate : function (s, t) {
                return (/^\d{13,16}$/).test(this.submitStr(s)) || s === "";
            }
        },
        
        creditCardCCV : {
            identifier : "cc-ccv",
            message : "This item must be 3 or 4 digits only.",
            submitStr : function (s) {
                return s.replace(/[ :\-\\\/,]/g, "");
            },
            validate : function (s, t) {
                return (/^\d{3,4}$/).test(this.submitStr(s)) || s === "";				
            }
        }	
    };
    
    //Add custom tests
    for (i in settings.customTests) {
        if (settings.customTests.hasOwnProperty(i)) {
            tests[i] = settings.customTests[i];
        }
    }
    
    //Generic event cancellation
    eventCancel = function (evt) {			
        if (evt.stopPropagation) {
            evt.stopPropagation();
            evt.preventDefault();
        } else {
            evt.cancelBubble = true;
            evt.returnValue = false;
        }		
    };	
    
    //Main form validation function
    formValidation = function (e) {

        var evt = e || window.event,
            target = evt.target || evt.srcElement,
            inputType = target.type || target.nodeName || 'window',
            eventType = evt.type.toLowerCase() || '',
            jTarget = jQuery(target),
            jForm = jTarget.closest("form"),
            formErrors = [],
            errorContainer = jQuery("<div class='form-error-summary'></div>"),
            i,			
            testFn;	
        
        //Run the appropriate tests for the current control			
        testFn = function (jControl) {
            
            var value = tests.trim.submitStr(jControl.val()),
                targetId = jControl.attr("id"),
                jContainer = jControl.closest("li"),
                jLabel = jContainer.find("label[for='" + targetId + "']").text().replace(", Required Field", ""),
                i,
                result,
                currMsg,
                errorTxt,
                errorEl,
                isError,			
                errors = [];
            
            //For each test, check if the identifier is present, and if so test.	
            for (i in tests) {
                if (tests.hasOwnProperty(i) && (jControl.hasClass(tests[i].identifier) || (jContainer.hasClass(tests[i].identifier) && tests[i].lookup === "container"))) {
        
                    result = tests[i].validate(value);
                    currMsg = jContainer.find("p." + tests[i].identifier + "-message");
                    errorTxt = "'" + jLabel.replace(":", "") + "'" + tests[i].message.replace("This item", "");
                    errorEl = jQuery("<p class='" + tests[i].identifier + "-message error-message'>" + errorTxt + "</p>");
                    isError = jContainer.hasClass("error");
                    
                    //If test failed, add the error text for this test to an array for display in the summary.
                    if (!result) {
                        errors.push(errorTxt);
                        if (currMsg.length === 0) {
                            jContainer.append(errorEl); //Insert the error message if the same message is not already present.
                        }
                        if (!isError) {
                            jContainer.addClass("error"); //Add the error class to container if not already present.
                        }
                    }
                    //If test passed
                    else {
                        jControl.val(tests[i].submitStr(value)); //Set the field value to the returnStr value.
                        currMsg.remove(); //Remove the error message for this test.
                    }
                }
            }
            
            //Once all tests have been run, handle errors
            if (errors.length === 0) {
                jContainer.removeClass("error").find("p.error-message").remove(); //If no errors, remove the error class from the container el.
            } else {
                for (i = 0; i < errors.length; i ++) {
                    formErrors.push(errors[i]); //Add all errors for this field to array for display in the summary.
                }
            }
        };
    
        //Run the test fn once on the current input only.
        if (!isSubmit && (eventType === "blur" || eventType === "focusout") && (inputType === "text" || inputType === "textarea")) {
            testFn(jTarget);
        //Run the test fn for every input and add / remove an errors list.	
        } else if (eventType === "submit") {
            jForm.find(".form-error-summary").remove();
            jForm.find("input[type='text'], textarea").each(function () {			
                testFn(jQuery(this));
            });

            if (formErrors.length > 0) {
                //If there is a form heading add the error container immediately after it, otherwise add it at the top of the form.
                if (jForm.find(".form-heading").length === 1) {
                    jForm.find(".form-heading").after(errorContainer);
                } else {
                    jForm.prepend(errorContainer);
                }
                
                //Add error summary
                errorContainer.prepend("<p>The following errors prevented this form from being processed:</p>").append("<ol class='error-list'></ol>");
                
                for (i = 0; i < formErrors.length; i ++) {
                    errorContainer.find("ol").append("<li>" + formErrors[i] + "</li>");
                }
                
                eventCancel(evt);
            }			
        }
        
        //Reset submit flag
        isSubmit = false;
    };			
    
    //Validation handlers. Event delegation is used so that form fields that are added / updated using AJAX will be validated.
    jQuery(this).each(function () {
        
        //Check on mousedown whether a submit event is attached to the current action, to avoid multiple event conflicts.
        jQuery("input:submit").live("mousedown", function () { // Live events are bound on the fly to AJAX added / updated elements.
            isSubmit = true;
        });

        //Cross browser submit listener
        this.onsubmit = formValidation;
        
        //IE only blur and focus listeners
        if (settings.eventTrigger === "both") {
            this.onfocusin = formValidation;
            this.onfocusout = formValidation;			
        }
        
        //FF etc blur and focus listeners. addEventListener is used in capture mode as focus and blur events do not bubble up.
        if (this.addEventListener && settings.eventTrigger === "both") {
            this.addEventListener('blur', formValidation, true);
            this.addEventListener('focus', formValidation, true);
        }
    });
    
    return jQuery(this);
};

/* Example of custom test definition. If an existing test has the same name it will be overwritten.
 * 
 *	jQuery("#custom-form").validateForm({
 *		customTests : {
 *			myTest : {
 *				identifier : "my-test",
 *				message : "This item is a test",
 *				submitStr : function (s) {
 *					return s.replace(/[\s,]+/g, "");
 *				},
 *				validate : function (s, t) {
 *					return (/^[^\D]*$/).test(this.submitStr(s)) || s === "";
 *				}
 *			}			
 *		}
 *	});
*/
