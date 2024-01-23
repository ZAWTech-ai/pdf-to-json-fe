function render_questions(raw) {
  console.log(raw);
  const data = raw.text_content;
  const answers = data.map((page) => getAnswersV2(page));
  const questions = data.map((page) => getQuestionsV2(page));
  const organizedQuestions = questions.map((page) => groupLinesByYaxis(page));
  const directions = organizedQuestions.map((page) => getDirections(page));
  const directionIndexes = directions.map((page) => getDirectionIndexes(page));
  const questionsWithAnswers = organizedQuestions.map((questions, index) =>
    addAnswersToEachQuestion(questions, answers[index])
  );
  const questionsSets = questionsWithAnswers.map((questionsWithAnswer, index) =>
    getQuestionsSet(
      questionsWithAnswer,
      directions[index],
      directionIndexes[index]
    )
  );
  const filteredQuestions = removeWithoutAnswers(
    mergeSameLine(mergeAllPages(filterQuestions(questionsSets)))
  );
  return { filteredQuestions };
}

const LOCAL_ENV = true;
const PYTHON_APP_BASE_URL = LOCAL_ENV
  ? "http://127.0.0.1:5000"
  : "http://ec2-54-179-34-103.ap-southeast-1.compute.amazonaws.com:5000";
function fetchDataFromPDF() {
  // Reset previous result and error messages
  document.getElementById("resultArea").innerHTML = "";
  document
    .getElementById("resultArea")
    .classList.remove("alert", "alert-danger");

  // Get the form and input elements
  const form = document.getElementById("quizForm");

  // Check if the form is valid
  if (form.checkValidity() === false) {
    form.classList.add("was-validated");
    return;
  }

  // Show loading bar
  document.getElementById("loadingBar").classList.remove("d-none");
  uploadFile().then((res) => {
    let combineAllFileResponse = [];
    res?.files?.map((item) => {
      const response = render_questions(item);
      combineAllFileResponse.push(response);
    });
    uploadFinish(combineAllFileResponse);
    // generateQuiz(res.text_content);
  });
}

function uploadFinish(result) {
  document.getElementById("loadingBar").classList.add("d-none");

  // Display the result (replace this with your actual result handling)
  const resultArea = document.getElementById("resultArea");
  const quizResult = document.getElementById("quiz-result");
  resultArea.classList.add("alert", "alert-success");
  const questions = result;
  //   const questions = JSON.parse(result).filteredQuestions;
  resultArea.innerHTML = `<strong>Success!</strong> Quiz generated successfully with ${questions.length} files.`;
  quizResult.innerHTML = "";
  questions?.map((singleFile, i) => {
    singleFile?.filteredQuestions?.forEach((question, index) => {
      const singleQuestion = `
          <div class="card p-2 mb-4">
          <h6>${index + 1}- ${question.direction}</h6>
          <h4>Q: ${question.question}</h4>
          <h4 >A: ${question.answer.join(",")}</h4>
          </div>
          `;
      quizResult.innerHTML += singleQuestion;
    });
  });
}

async function generateQuiz(data) {
  var myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  var raw = JSON.stringify({
    text_content: data,
  });

  var requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow",
  };

  await fetch("http://localhost:3002/upload", requestOptions)
    .then((response) => response.text())
    .then((result) => uploadFinish(result))
    .catch((error) => console.log("error", error));
}

async function uploadFile() {
  return new Promise(async (resolve, reject) => {
    // const inputFile = document.getElementById("pdfFile");
    // const selectedFile = inputFile.files[0];
    // var formdata = new FormData();
    // formdata.append(
    //   "file",
    //   selectedFile,
    //   "PV L11.1 who which in with (RTK55) (Answers).pdf"
    // );
    const inputFile = document.getElementById("pdfFile");
    const selectedFiles = inputFile.files;
    var formdata = new FormData();

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      // Append each file with a unique key, for example, "file_0", "file_1", etc.
      formdata.append(`files`, file, file.name);
    }
    var requestOptions = {
      method: "POST",
      body: formdata,
      redirect: "follow",
    };

    try {
      const response = await fetch(
        `${PYTHON_APP_BASE_URL}/upload`,
        requestOptions
      );
      const result = await response.json(); // Parse the JSON response

      // Resolve the promise with the result
      resolve(result);
    } catch (error) {
      console.log("error", error);

      // Reject the promise with the error
      reject(error);
    }
  });
}
