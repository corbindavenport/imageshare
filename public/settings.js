// Set upload radio box based on saved setting and update setting on click
var uploadType = localStorage.getItem('uploadType') || 'imageshare';
var uploadTypeElement = document.getElementById('upload-type-' + uploadType);
if (uploadTypeElement) {
    uploadTypeElement.checked = true;
    uploadTypeElement.onclick = function () {
        localStorage.setItem('uploadType', this.value);
    };
}

// Update settings on forum element click
var elements = document.querySelectorAll('input[name="upload-type"]');
for (var i = 0; i < elements.length; i++) {
    elements[i].onchange = function () {
        localStorage.setItem('uploadType', this.value);
    };
}