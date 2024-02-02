function render_questions(raw) {
  const data = raw.files[0].text_content;
  // Get answers on the basis of red color shade
  const answers = data.map((page) => getAnswersV2(page));

  // Replacing answer in the data with ________
  const questions = data.map((page) => getQuestionsV2(page));
  // Merge each line to create a complete sentence
  const organizedQuestions = questions
    .map((page) => reArrangeYValues(page))
    .map((page) => groupLinesByYaxis(page))
    .map((page) => mergeSameLine(page));
  // Get line that starts with Number, Roman or Alphabet to consider it as a question
  const finalQuestions = organizedQuestions.map((page) =>
    getNumberedList(page)
  );

  // Get Directions by using regex
  const directions = organizedQuestions.map((page) => getDirections(page));
  const directionIndexes = directions.map((page) => getDirectionIndexes(page));

  // Adding answers to each question based on Y axis
  const questionsWithAnswers = finalQuestions.map((questions, index) =>
    addAnswersToEachQuestion(questions, answers[index], index)
  );

  const questionsWithDirections = questionsWithAnswers
    .map((page, index) => addDirectionsToEachQuestion(page, directions[index]))
    .map((page) => removeWithoutAnswers(page));
  console.log(questionsWithDirections);
  return questionsWithDirections;
  // Identity keywords enclosed in box
  // const questionSetsWithBoxedAnswers = questionsSets.map((page) =>
  //   identityBoxedanswers(page)
  // );
  // console.log(questionsWithDirections);

  // console.log(questionSetsWithBoxedAnswers);
  // const filteredQuestions = removeWithoutAnswers(
  //   mergeSameLine(mergeAllPages(filterQuestions(questionSetsWithBoxedAnswers)))
  // );
  // const removeEmptyQuestions = filteredQuestions?.filter((item) => {
  //   const isNotOnlyUnderscores = !isQuestion(item);
  //   return isNotOnlyUnderscores;
  // });
  // return groupByPage(removeEmptyQuestions);
}
// function render_questions(raw) {
//   const data = raw.files[0].text_content;
//   // Answers set
//   const answers = data.map((page) => getAnswersV2(page));
//   // Questions Set
//   const questions = data.map((page) => getQuestionsV2(page));
//   const organizedQuestions = questions
//     .map((page) => groupLinesByYaxis(page))
//     .map((page) => mergeSameLine(page));
//   // const organizedQuestions = questions
//   //   .map((page) => reArrangeYValues(page))
//   //   .map((page) => groupLinesByYaxis(page))
//   //   .map((page) => mergeSameLine(page));
//   // Directions set
//   const mergedQuestions = organizedQuestions.map((page) => mergeSameLine(page));
//   const directions = organizedQuestions.map((page) => getDirections(page));
//   const directionIndexes = directions.map((page) => getDirectionIndexes(page));
//   const questionsWithAnswers = organizedQuestions.map((questions, index) =>
//     addAnswersToEachQuestion(questions, answers[index], index)
//   );

//   const questionsSets = questionsWithAnswers.map((questionsWithAnswer, index) =>
//     getQuestionsSet(
//       questionsWithAnswer,
//       directions[index],
//       directionIndexes[index]
//     )
//   );
//   // Function to identity keywords enclosed in box
//   const questionSetsWithBoxedAnswers = questionsSets.map((page) =>
//     identityBoxedanswers(page)
//   );
//   console.log(questionSetsWithBoxedAnswers);
//   const filteredQuestions = removeWithoutAnswers(
//     mergeSameLine(mergeAllPages(filterQuestions(questionSetsWithBoxedAnswers)))
//   );
//   const removeEmptyQuestions = filteredQuestions?.filter((item) => {
//     const isNotOnlyUnderscores = !isQuestion(item);
//     return isNotOnlyUnderscores;
//   });
//   return groupByPage(removeEmptyQuestions);
// }

const isQuestion = (item) => {
  if (item?.question && typeof item.question === "string") {
    // Regular expression to match only underscores
    var regex = /^_+$/;
    return regex.test(item.question.trim()); // Trim whitespace before testing
  }
  return false;
};

const LOCAL_ENV = false;
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
    response.forEach((res) => uploadFinish(res));

    // generateQuiz(res.text_content);
  });
}

const quizResult = document.getElementById("quiz-result");
let questionsLength = 0;
function uploadFinish(result) {
  document.getElementById("loadingBar").classList.add("d-none");

  // Display the result (replace this with your actual result handling)
  const resultArea = document.getElementById("resultArea");
  resultArea.classList.add("alert", "alert-success");
  const questions = result;
  //   const questions = JSON.parse(result).filteredQuestions;
  questionsLength += questions.length;
  resultArea.innerHTML = `<strong>Success!</strong> Quiz generated successfully with ${questionsLength} questions.`;
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
    const selectedFile = inputFiles.files;
    var formdata = new FormData();
    // formdata.append("files", inputFiles.files[0], inputFiles.files[0].name);

    for (let i = 0; i < selectedFile?.length; i++) {
      const file = selectedFile[i];
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
