
// Set the upload type based on the user's past selections, use cookies to remember the selection
var uploadType = localStorage.getItem('uploadType') || 'imageshare';
var uploadTypeElement = document.getElementById('upload-type-' + uploadType);
if (uploadTypeElement) {
    uploadTypeElement.checked = true;
    uploadTypeElement.onclick = function () {
        localStorage.setItem('uploadType', this.value);
    };
}
// If the user ever changes it, edit the cookie
var elements = document.querySelectorAll('input[name="upload-type"]');
for (var i = 0; i < elements.length; i++) {
    elements[i].addEventListener('change', function () {
        localStorage.setItem('uploadType', this.value);
    });
}