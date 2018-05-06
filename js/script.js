// reads number of variables and constraints and calls makeForm
function generateMatrix() {
	var form = document.forms['formularz'];
	var variables = form.variables.value;
	var constraints = form.constraints.value;
	if (variables < 1) {
		return "Liczba zmiennych powinna być większa niż 0";
	}
	else if (constraints < 1) {
		return "Liczba ograniczeń powinna być większa niż 0";
	}
	else if (constraints <= variables) {
		return makeForm("form_input", variables, constraints);
	}
	return "Liczba ograniczeń powinna być mniejsza lub równa liczbie zmiennych";
}

// generates form with proper number of columns and rows
// creates button to call algorithm simplex
function makeForm(name, ii, jj){
    var form = '<form id="' + name + '" action="simplex.html" method="post">';
    form += '<table>';
    form += '<tr>';
    for (j = 0; j < jj; j++) {
        form += '<th>X' + j + '</th>';
    }
    form += '<th>Ograniczenie</th>'
    form += '</tr>';
    for (i = 0; i < ii; i++) {
        form += '<tr>';
        for (j = 0; j < jj; j++) {
            form += '<td><input type="number" class="form_number" name="a'+i+j+'" value="0" /></td>';
        }
        form += '<td><input type="number" class="form_number" name="c'+i+'" value="0" /></td>';
        form += '</tr>';
    }
    for (j = 0; j < jj; j++) {
        form += '<td><input type="number" class="form_number" name="price'+j+'" value="0" /></td>';
    }
    form += '<td>Wartość</td>';
    form += '</table></form>';
    form += calculateMatrixButton(name, ii, jj);
    return form;
}

function calculateMatrixButton(name, ii, jj) {
    return '<div id="div_button_calculateMatrix">' +
         '<button type="button" id="button_calculateMatrix" ' +
         'onclick="document.getElementById(\'div_output\').innerHTML = ' +
         'calculate(\'' + name + '\',' + ii + ',' + jj + ')">' +
         'Oblicz metodą simplex</button></div>' +
         '<div id="div_output"></div>';
}

// return data in array prepared for simplex method
function matrixToArray(name, ii, jj)
{
	var form = document.forms[name];
	// var k = 0;
	var arr = [ii, jj];
	var matrix = [];
	var constraints = [];
	var price = [];
	for (i = 0; i < ii; i++) {
		matrix[i] = [];
		for (j = 0; j < jj; j++) {
			var item = "a"+i+j;
			// matrix[k++] = form[item].value;
			matrix[i][j] = form[item].value;
		}
		var item =  "c"+i;
		constraints[i] = form[item].value;
	}
	for (j = 0; j < jj; j++) {
		var item = "price"+j;
		price[j] = form[item].value;
	}
	arr[2] = matrix;
	arr[3] = constraints;
	arr[4] = price;
	return arr;
}

// remove useless parameter name and call simplex
function calculate(name, ii, jj) {
	var arr = matrixToArray(name, ii, jj);
	var cols = arr[0];
	var rows = arr[1];
	var matrix = arr[2];
	var constraints = arr[3];
	var price = arr[4];
	var base = [];

	// is data correct?
	// sum lenth in all columns
	var totalLength = 0;
	for (i = 0; i < matrix.length; i++) {
		totalLength += matrix[i].length;
	}

	// is matrix correct?
	if ( totalLength != cols * rows ) {
		alert("incorrect number of arguments");
	}
	// are constraints correct?
	else if ( constraints.length != cols ) {
		alert("incorrect number of constraints");
	}
	// are prices correct?
	else if ( price.length != rows ) {
		alert("incorrect number of values");
	}

	// extend matrix to canonical
	// set each base area equal 0
	for (i = 0; i < ii; i++) {
		for (j = jj; j < ii + jj*1; j++) {
			matrix[i][j] = 0;
			price[j] = 0;
		}
		matrix[i][i+jj*1] = 1;
		base[i] = 0;
	}
	var J = ii + jj*1;

	// first values of zj and dj
	var zj = [];
	var dj = [];	// delta
	for (j = 0; j < J; j++) {
		zj[j] = 0;
		dj[j] = price[j];
	}

	var M = [];	// copy of matrix
	var GC;		// GreatColumn ptr
	var SR;		// SmallRow ptr
	var CR;		// CurrentRow ptr
	var keyCol = [];
	var minBi = [];
	var fmax = 0;
	var result = getIterationResult(rows, cols, matrix, constraints, price, base, zj, dj, fmax) + "<br>";

	// iterations
	do {
		// copy matrix
		for (i = 0; i < ii; i++) {
			M[i] = [];
			for (j = 0; j < J; j++){
				M[i][j] = matrix[i][j];
			}
		}

		// find greatest column and smallest row
		try {
			GC = greatestInArray(dj);
		}
		catch (err) {
			return err.message;
		}
		var Bi = [];
		for (i = 0; i < ii; i++) {
			keyCol[i] = matrix[i][GC];
			minBi[i] = constraints[i] / keyCol[i];
		}
		try {
			SR = smallestInArray(minBi);
		}
		catch (err) {
			return err.message;
		}

		// calculate new smallest row
		base[SR] = price[GC];
		for (j = 0; j < J; j++) {
			matrix[SR][j] /= M[SR][GC];
		}
		var oldCSR = constraints[SR];
		constraints[SR] /= M[SR][GC];

		// calculate other rows
		for (i = 0; i < ii; i++) {
			if (i == SR) {
				continue;
			}
			var dif = M[i][GC] / M[SR][GC];
			for (j = 0; j < J; j++) {
				matrix[i][j] -= M[SR][j] * dif;
			}
			constraints[i] -= oldCSR * dif;
		}

		// compute zj
		for (j = 0; j < J; j++) {
			zj[j] = 0;
			for (i = 0; i < ii; i++) {
				zj[j] += base[i] * matrix[i][j];
			}
		}
		// compute fmax
		fmax = 0;
		for (i = 0; i < ii; i++) {
			fmax += base[i] * constraints[i];
		}

		// calculate dj
		for (j = 0; j < J; j++) {
			dj[j] = price[j] - zj[j];
		}
		result += getIterationResult(rows, cols, matrix, constraints, price, base, zj, dj, fmax) + "<br>";
	} while (greatestInArray(dj) != -1);

	return result;
}

function greatestInArray(arr) {
	var greatPtr = 0;
	var greatValue = 0;
	for (i = 0; i < arr.length; i++) {
		if (arr[i] > greatValue) {
			greatValue = arr[i];
			greatPtr = i;
		}
	}
	if (greatValue == 0) {
		return -1;
	}
	else {
		return greatPtr;
	}
}

function smallestInArray(arr) {
	var smallPtr = 0;
	var smallValue = 999999999;
	for (i = 0; i < arr.length; i++) {
		if (arr[i] >= 0 && arr[i] < smallValue) {
			smallValue = arr[i];
			smallPtr = i;
		}
	}
	if (smallValue == 999999999) {
		return -1;
	}
	else {
		return smallPtr;
	}
}

function getIterationResult(rows, cols, matrix, constraints, price, base, zj, dj, fmax)
{
	// set precision
	var p = 3;
	// first row
	var result = "";
	var J = cols + rows*1;
	result += '<table><tr id="price_row"><th>cj</th>';
	for (j = 0; j < J; j++) {
		result += '<td>' + Round(price[j], p) + '</td>';
	}
	result += '<td></td></tr>';

	// second row
	result += '<tr><th id="base_col">Baza</th>';
	for (j = 0; j < J; j++) {
		result += '<td id="zj_row">x' + j + '</td>';
	}
	result += '<th id="constraints_col">Bi</th></tr>';

	// regular rows
	for (i = 0; i < rows; i++) {
		result += '<tr><td id="base_col">' + base[i] + '</td>';
		for (j = 0; j < J; j++) {
			result += '<td>' + Round(matrix[i][j], p) + '</td>';
		}
		result += '<td id="constraints_col">' + Round(constraints[i], p) + '</td></tr>';
	}

	// zj row
	result += '<tr id="zj_row"><th>zj</th>';
	for (j = 0; j < J; j++) {
		result += '<td>' + Round(zj[j], p) + '</td>';
	}
	result += '<th id="fmax">f -> max</th></tr>';

	// dj row
	result += '<tr id="dj_row"><th>dj</th>';
	for (j = 0; j < J; j++) {
		result += '<td>' + Round(dj[j], p) + '</td>';
	}
	result += '<th id="fmax">' + Round(fmax, p) + '</th></tr>';

	return result;
}

function Round(n, k)
{
	var factor = Math.pow(10, k);
	return Math.round(n*factor)/factor;
}
