const getAnswersV2 = (data) => {
  const answers = data.filter(
    (item) =>
      isRedShade(item.color.toUpperCase()) ||
      ANSWER_COLOR.includes(item.color.toUpperCase())
  );
  return answers;
};

const getQuestionsV2 = (data) => {
  const questions = data.map((item, index) => {
    if (
      isRedShade(item.color.toUpperCase()) ||
      ANSWER_COLOR.includes(item.color.toUpperCase())
    ) {
      return {
        ...item,
        y: item.y.toFixed(1),
        text: "_____",
        index,
      };
    } else {
      return { ...item, y: item.y.toFixed(1), index };
    }
  });
  return questions;
};

const groupLinesByYaxis = (data) => {
  const groupedByY = {};
  data.forEach((item) => {
    const { y } = item;
    const yIndex = parseFloat(y).toFixed(0);
    // Check if the 'y' value is already a key in the dictionary
    if (groupedByY[yIndex]) {
      groupedByY[yIndex].push(item);
    } else {
      groupedByY[yIndex] = [item];
    }
  });
  const sorted = Object.values(groupedByY).map((group) => {
    return group.sort((a, b) => a.x - b.x);
  });
  const merged = sorted.map((sort) => {
    return {
      ...sort[0],
      text: sort.map((single) => single.text).join(" "),
    };
  });
  return merged;
};

const reArrangeYValues = (page) => {
  // Function to check if two numbers are within a certain threshold
  const isClose = (num1, num2, threshold = 3) =>
    Math.abs(num1 - num2) <= threshold;

  // Iterate over the array starting from the second element
  for (let i = 1; i < page.length; i++) {
    // Check if the difference between current and previous y values is within the threshold
    if (isClose(page[i].y, page[i - 1].y)) {
      // Update the y value of the current object to match the previous one
      page[i - 1].y = page[i].y;
    }
  }

  return page;
};

const mergeWordsForSameLine = (data) => {
  const mergedData = data.reduce((accumulator, currentItem) => {
    const existingItem = accumulator.find(
      (item) =>
        Math.trunc(item.y) === Math.trunc(currentItem.y) &&
        item.page === currentItem.page
    );

    if (existingItem) {
      // Concatenate text if y-axis value exists in the accumulator
      existingItem.text += currentItem.text;
    } else {
      // Add new entry if y-axis value does not exist in the accumulator
      accumulator.push({
        y: currentItem.y,
        text: currentItem.text,
        x: currentItem.x,
        page: currentItem.page,
      });
    }

    return accumulator;
  }, []);

  const groupedItems = {};

  // Iterate through the data array and group items based on y and page properties
  mergedData.forEach((item) => {
    const page = item.page;
    if (!groupedItems[page]) {
      groupedItems[page] = [];
    }
    groupedItems[page].push(item);
  });

  const groupedByPage = Object.values(groupedItems).map((page) =>
    page.sort((a, b) => a.y - b.y)
  );

  let result = [];
  let currentText = "";
  for (const page of groupedByPage) {
    for (const item of page) {
      currentText += item.text;
      if (item.text.trim().endsWith("。") || item.text.trim().endsWith(".")) {
        result.push({
          ...item,
          y: item.y,
          text: currentText,
          x: item.x,
          page: item.page,
        });
        currentText = "";
      }
    }
  }
  result = result.map((line) => {
    return {
      ...line,
      text: line.text.replace(/^_+|_+$/g, ""),
    };
  });
  return result;
};

const mergeSameLine = (data) => {
  const mergedArray = [];
  let currentText = "";
  let currentAnswer = [];
  let currentY = [];
  data.forEach((item, index) => {
    if (/^_+$/.test(item?.text.trim()) || item?.text.trim() === "") {
      console.log(item);
      return;
    }

    // Concatenate the "text" values until it ends with a period ('.')
    currentText += " " + item.text;
    currentY.push(item.y);
    currentAnswer = currentAnswer.concat(item.answer || []);
    if (
      item?.text?.trim()?.endsWith(".") ||
      item?.text?.trim()?.endsWith("?") ||
      item?.text?.trim()?.endsWith(")") ||
      item?.text?.trim()?.endsWith("。") ||
      startsWithRomanNumeral(data[index + 1]?.text?.trim())
    ) {
      // If the current "text" ends with a period, push it to the merged array
      mergedArray.push({
        ...data[index - 1],
        text: currentText.trim(),
        answer: currentAnswer,
        y: currentY,
      });

      // Reset currentText for the next iteration
      currentText = "";
      currentAnswer = [];
      currentY = [];
    }
  });
  return mergedArray;
};
const startsWithRomanNumeral = (str) => {
  // Regular expression to match Roman numerals, letters, or numbers followed by a dot
  // const regex = /^(?:(?:[ivxlcdm]+|[a-zA-Z]+|\d+)\.\s*)/i;
  // const regex = /^\s*(\d+\.|i{1,3}\.|[ivxlcdm]+\.)/i;
  // const regex = /^\s*(\d+|[ivxlcdm]+)\s*\./i; -----------------------------Current
  const regex =
    /^(?:[ivxlcdm]+\s*|[a-z]+\s*|\d+\s*|\d+\.\s*|[ivxlcdm]+\.\s*|[a-z]+\.\s*)/i;
  // const regex2 = /^(?:(?:[ivxlcdm]+|[a-zA-Z]+|\d+)\s*)/i;
  return regex.test(str);
};

const getNumberedList = (data) => {
  const questions = data
    .map((item) => {
      return {
        ...item,
      };
    })
    .filter((item) => startsWithRomanNumeral(item.text));
  return questions;
};
const getNonNumberList = (data) => {
  const questions = data
    .map((item) => {
      return {
        ...item,
      };
    })
    .filter((item) => startsWithnonNumeral(item.text));
  return questions;
};
const startsWithnonNumeral = (str) => {
  // Regular expression to match Roman numerals, letters, or numbers followed by a dot
  // const regex = /^(?:(?:[ivxlcdm]+|[a-zA-Z]+|\d+)\.\s*)/i;
  // const regex = /^\s*(\d+\.|i{1,3}\.|[ivxlcdm]+\.)/i;
  const regex = /^\s*(\d+|[ivxlcdm]+)\s*\./i;
  // const regex2 = /^(?:(?:[ivxlcdm]+|[a-zA-Z]+|\d+)\s*)/i;
  return !regex.test(str);
};
const isRedColor = (color) => {
  // Assuming color is in the format #RRGGBB
  // Extract the red component (first two characters) and convert to decimal
  const redComponent = parseInt(color.substring(1, 3), 16);

  // Check if redComponent is greater than a threshold (adjust as needed)
  return redComponent > 128; // Adjust threshold as needed
};

function isRedShade(hexColor) {
  // Remove the # symbol if present
  hexColor = hexColor.replace("#", "");

  // Convert the hexadecimal color code to RGB
  const r = parseInt(hexColor.substring(0, 2), 16);
  const g = parseInt(hexColor.substring(2, 4), 16);
  const b = parseInt(hexColor.substring(4, 6), 16);

  // Check if the color is a shade of red
  // You can adjust the threshold values based on your preference
  return r > 150 && g < 100 && b < 100;
}

const getDirections = (data) => {
  const directions = data
    .map((line, index) => {
      return {
        index,
        ...line,
      };
    })
    .filter((line) => isFillInTheBlanksDirection(line.text));
  return directions;
};

const addAnswersToEachQuestion = (questions, answers, pageNum) => {
  const filteredQuestions = questions.map((question, index) => {
    const filteredAnswers = getFilteredAnswers(question, answers);
    const answersWithoutDuplication = removeDuplicates(filteredAnswers, "x")
      .map((answer) => answer.text.replace(/^\d+\s*\.?/, ""))
      .map((answer) => answer?.trim()?.replace(/\//g, "|"));
    return {
      ...question,
      answer: answersWithoutDuplication,
      page: pageNum + 1,
    };
  });

  return filteredQuestions;
};
function removeDuplicates(array, property) {
  let seen = new Set();
  return array.filter((obj) => {
    let value = obj[property];
    if (!seen.has(value)) {
      seen.add(value);
      return true;
    }
    return false;
  });
}
const getFilteredAnswers = (question, answers) => {
  if (Array.isArray(question.y)) {
    return question.y.flatMap((yValue) =>
      filterAnswersForY(question, answers, yValue)
    );
  } else {
    return filterAnswersForY(question, answers, question.y);
  }
};

const filterAnswersForY = (question, answers, yValue) => {
  const maxY = parseFloat(yValue) + ANSWER_TOLLERANCE;
  const minY = parseFloat(yValue) - ANSWER_TOLLERANCE;

  return answers
    .filter(
      (answer) =>
        (Math.trunc(yValue) === Math.trunc(answer.y) ||
          (answer.y > minY && answer.y < maxY)) &&
        question.page === answer.page
    )
    .map((answer) => answer);
};

const filterQuestions = (data) => {
  return data.filter((page) => page.length > 0);
};

const mergeAllPages = (pages) => {
  const mergedPages = [];
  const mergedSets = [];
  pages.forEach((page, index) => {
    page.forEach((questionsSet, index) => {
      mergedPages.push(questionsSet);
    });
  });
  removeUnwanted(mergedPages).forEach((set, index) => {
    mergedSets.push(...set);
  });
  return mergedSets.map((question) => {
    const { text, answer, direction, page } = question;
    return {
      direction,
      text,
      answer,
      page,
    };
  });
};

function groupByPage(data) {
  const groupedDataArray = Object.values(
    data.reduce((result, current) => {
      // Check if a group for the current page exists
      if (!result[current.page]) {
        // If not, create a new group
        result[current.page] = [];
      }
      // Add the current object to the group
      result[current.page].push(current);
      return result;
    }, {})
  );
  return groupedDataArray;
}

const removeUnwanted = (data) => {
  return data.map((questionSet) =>
    questionSet.filter((question) => question.text != "_____")
  );
};
const emptySpaceWithDashLine = (data) => {
  return data.map((question) => {
    return {
      ...question,
      text: question.text.trim().replace(/\s{3,}/g, "_____"),
    };
  });
};
const removeWithoutAnswers = (data) => {
  return data
    .filter((question) => question.answer.length > 0)
    .map((data) => {
      return {
        direction: data.direction.replace(/^[0-9A-Za-z]+\./, "").trim(),
        question: data.text.replace(/^[0-9A-Za-z]+\./, "").trim(),
        answer: data.answer.map((answer) => answer?.trim()),
        page: data.page,
        y: data.y,
      };
    });
};

const identityBoxedanswers = (questionsSet) => {
  return questionsSet.map((set) => {
    return set.map((single) => {
      return {
        ...single,
        direction: `${single.direction} - ${identifyBoxedAnswers(set)}`,
      };
    });
  });
};

const identifyBoxedAnswers = (set) => {
  const answers = [];
  set.forEach(({ answer }) => {
    if (answer) {
      answers?.push(...answer);
    }
  });
  let boxedAnswers = "";
  const answerSet = new Set(shuffleArray(answers));
  answerSet.forEach((answer) => {
    if (set[0].rawBoxedAnswers.includes(answer)) {
      boxedAnswers += answer + ",";
    }
  });
  return boxedAnswers;
};

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function addDirectionsToEachQuestion(questions, directions) {
  console.log(questions);
  const questionsWithDirections = [];

  if (directions?.length === 0) {
    questions?.forEach((question) => {
      questionsWithDirections?.push({
        ...question,
        question: question?.text,
        direction: "[Add direction here]",
      });
    });
    return questionsWithDirections;
  }
  directions.forEach((direction, index) => {
    questions.forEach((question) => {
      if (index < directions.length - 1) {
        if (
          question.index > direction.index &&
          question.index < directions[index + 1].index
        ) {
          questionsWithDirections.push({
            ...question,
            question: question.text,
            direction: direction.text,
          });
        }
      } else {
        if (question.index > direction.index) {
          questionsWithDirections.push({
            ...question,
            question: question.text,
            direction: direction.text,
          });
        }
      }
    });
  });
  return questionsWithDirections;
}

function getProvidedAnswers(directionIndex, questionIndex, data) {
  const refinedDirectionIndexes = closestDIrectionIndexToQuestion(
    directionIndex,
    questionIndex
  );
  return data
    .filter(
      (record) =>
        record.index > refinedDirectionIndexes && record.index < questionIndex
    )
    .map((filtered) => filtered.text)
    .join(" ");
}

function closestDIrectionIndexToQuestion(directionIndexes, questionIndex) {
  const array = directionIndexes;
  let closest = array[0];

  array.forEach((element) => {
    if (Math.abs(element - questionIndex) < Math.abs(closest - questionIndex)) {
      closest = element;
    }
  });
  return closest;
}

function addProvidedAnswersToDirection(questions, providedAnswers) {
  return questions.map((question) => {
    const { answer, direction } = question;
    const concatenatedDirection =
      direction +
      (providedAnswers != null && providedAnswers != ""
        ? "&#10;" + shuffleArray(providedAnswers.split(" ")).join(" ")
        : "");
    return { ...question, direction: concatenatedDirection };
  });
}
