let fileValid = false;

// Validating the users input for the upload of the pictures.
function validateForm() {

    const title = document.forms.pictureuploadform.title.value.trim();
    const description = document.forms.pictureuploadform.description.value;;

    const titleMaxLength = 128;
    if (title.length === 0 || title.length > titleMaxLength) {
        console.log("Error title length = " + title.length);
        return false;
    };

    const descriptionMaxLength = 2048;
    if (description.length > descriptionMaxLength) {
        console.log("Error description length = " + description.length);
        return false;
    };

    fileValid = true;

    return fileValid;
};

// Validating the upload file for the upload of the pictures.
function handleFileUpload(files) {
    const file = files[0];

    const fileSize = file.size;
    const mimeArray = file.type.split("/");
    const fileType = mimeArray[0];

    if (fileType !== "image") {
        console.log("Error file type = " + fileType);
        fileValid = false;
        return;
    };

    // 5MB
    const fileSizeLimit = 40000000;
    if (fileSize > fileSizeLimit) {
        console.log("Error file size = " + fileSize);
        fileValid = false;
        return;
    };

    fileValid = true;

    return fileValid;
};