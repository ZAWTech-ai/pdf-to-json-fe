function render_questions(raw) {
  const data = raw.files[0].text_content;
  // Answers set
  const answers = data.map((page) => getAnswersV2(page));
  // Questions Set
  const questions = data.map((page) => getQuestionsV2(page));
  const organizedQuestions = questions
    .map((page) => reArrangeYValues(page))
    .map((page) => groupLinesByYaxis(page));
  // Directions set
  const mergedQuestions = organizedQuestions.map((page) => mergeSameLine(page));
  const directions = organizedQuestions.map((page) => getDirections(page));

  const directionIndexes = directions.map((page) => getDirectionIndexes(page));
  const questionsWithAnswers = organizedQuestions.map((questions, index) =>
    addAnswersToEachQuestion(questions, answers[index], index)
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
  return groupByPage(filteredQuestions);
}

const LOCAL_ENV = true;
const PYTHON_APP_BASE_URL = LOCAL_ENV
  ? "http://127.0.0.1:5000"
  : "https://ai.edhub.school";
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
    const response = render_questions(res);
    console.log(response);
    response.forEach((res) => uploadFinish(res));

    // generateQuiz(res.text_content);
  });
}

const quizResult = document.getElementById("quiz-result");
function uploadFinish(result) {
  document.getElementById("loadingBar").classList.add("d-none");

  // Display the result (replace this with your actual result handling)
  const resultArea = document.getElementById("resultArea");
  resultArea.classList.add("alert", "alert-success");
  const questions = result;
  //   const questions = JSON.parse(result).filteredQuestions;
  resultArea.innerHTML = `<strong>Success!</strong> Quiz generated successfully with ${questions.length} questions.`;
  let innerHTML = `<div class="card p-2 mb-4">`;
  questions.forEach((question, index) => {
    const singleQuestion = `
          <div class="mb-4 p-2">
            <h6>${index + 1}- ${question.direction}</h6>
            <h4>Q: ${question.question}</h4>
            <h4 >A: ${question.answer.join(",")}</h4>
          </div>
          `;
    innerHTML += `${singleQuestion}`;
  });
  innerHTML += "</div>";
  quizResult.innerHTML += innerHTML;
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
    const inputFiles = document.getElementById("pdfFile");
    // const selectedFile = inputFile.files[0];
    var formdata = new FormData();
    formdata.append("files", inputFiles.files[0], inputFiles.files[0].name);

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
