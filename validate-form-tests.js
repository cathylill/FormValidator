/*
 * Form Validation Test Scripts
 */
if (!formValidTest) {
	var formValidTest = {};
}

formValidTest.testActions = {
    testBlur : function (sForm, sInput, val, expected) {
        var result,
            form = jQuery(sForm).validateForm();
			
        expected = (expected === 1) ? true : false;
        form.find(sInput).focusin().focus().val(val).focusout().blur();
        result = form.find(".error-message").length > 0;
        return same(result, expected, 'onBlur error reported for input "' + val + '"');
    },
    testSubmit : function (sForm, sInput, val, expected) {
        var result,
            form = jQuery(sForm).validateForm();
            
        expected = (expected === 1) ? true : false;
		form.submit(function (event) {
			event.preventDefault();
		});
		
        form.find(sInput).val(val);
		form.submit();
        result = form.find(".form-error-summary .error-list li").length > 0;
        return same(result, expected, 'onSubmit error reported for input "' + val + '"');
    }
};

formValidTest.testDefs = {
    required : {
        name : "Required",              //Test name to display on test page
        sForm : "form#test-required",   //Selector representing element to test
        sInput : ".text",               //Selector representing input element to test
        inputs : ["", "123 abc"],       //Inputs to test
        results : [1, 0]                //Expected results - 1 = error reported, 0 = no error reported
    },
    text : {
        name : "Text",
        sForm : "form#test-text",
        sInput : ".text",
        inputs : ["", "123 abc", "<script>", "a    b  c", "$"],
        results : [0, 0, 1, 0, 0]
    },
    number : {
        name : "Number",
        sForm : "form#test-number",
        sInput : ".number",
        inputs : ["", "123 abc", "123 123", "$"],
        results : [0, 1, 0, 1]
    },
    date : {
        name : "Date",
        sForm : "form#test-date",
        sInput : ".date",
        inputs : ["", "12/12/2009", "12th Jan 09", "34/13/2009", "12-12-2009"],
        results : [0, 0, 1, 1, 0]
    },
    time : {
        name : "Time",
        sForm : "form#test-time",
        sInput : ".time",
        inputs : ["", "12:31", "19 45", "27:61", "5am"],
        results : [0, 0, 0, 1, 1]
    },
    email : {
        name : "Email Address",
        sForm : "form#test-email",
        sInput : ".email",
        inputs : ["", "test@test.com", "mr.a@test.com.au", "test at test dot com", "test@test"],
        results : [0, 0, 0, 1, 1]
    },
    postcode : {
        name : "Postcode",
        sForm : "form#test-postcode",
        sInput : ".postcode",
        inputs : ["", "2290", "KA27 8AA", "<script>", "12341234123412341"],
        results : [0, 0, 0, 1, 1]
    },
    ccNum : {
        name : "Credit Card Number",
        sForm : "form#test-cc-number",
        sInput : ".cc-number",
        inputs : ["", "111111111111", "11112222333344445", "111122223333bbbb", "$"],
        results : [1, 1, 1, 1, 1]
    },
    ccCCV: {
		name: "Credit Card CCV",
		sForm: "form#test-cc-ccv",
		sInput: ".cc-ccv",
		inputs: ["", "12", "123", "1234", "$", "12c5"],
		results: [0, 1, 0, 0, 1, 1]
	}
};

formValidTest.TestObj = function (name, inputs, form, element, results) {
	test(name, function () {
        for (var n in inputs) {
            if (inputs.hasOwnProperty(n)) {
                formValidTest.testActions.testBlur(form, element, inputs[n], results[n]);
                formValidTest.testActions.testSubmit(form, element, inputs[n], results[n]);
            }
        }
	});
};

jQuery(document).ready(function () {
	jQuery("#test-html").hide();
	
	(function () {
		var createTest,
		    i;

		for (i in formValidTest.testDefs) {
			if (formValidTest.testDefs.hasOwnProperty(i)) {
				createTest = new formValidTest.TestObj(formValidTest.testDefs[i].name, formValidTest.testDefs[i].inputs, formValidTest.testDefs[i].sForm, formValidTest.testDefs[i].sInput, formValidTest.testDefs[i].results);
			}
		}
	}());
});
