function saveLastTrialData() {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'write-data.php');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function() {
        if(xhr.status == 200){
            var response = JSON.parse(xhr.responseText);
            if(response.success !== true) {
                if(!window.ignoreSaveErrors) {
                    psychoJS.gui.dialog({
                        warning: response.message,
                        showOK: true
                    });
                }
            }
        }
    };
    xhr.send(jsPsych.data.getLastTrialData().json());
    console.log('Saving data:');
    console.log(jsPsych.data.getLastTrialData().json());
}