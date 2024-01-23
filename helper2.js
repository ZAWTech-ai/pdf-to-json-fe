const getAnswersV2 = (data) => {
  const answers = data.filter((item) => isRedColor(item.color.toUpperCase()));
  return answers;
};

const getQuestionsV2 = (data) => {
  const questions = data.map((item) => {
    if (isRedColor(item.color.toUpperCase())) {
      return {
        ...item,
        y: item.y.toFixed(1),
        text: "_____",
      };
    } else {
      return { ...item, y: item.y.toFixed(1) };
    }
  });
  return questions;
};

const groupLinesByYaxis = (data) => {
  const groupedByY = {};
  data.forEach((item) => {
    const { y } = item;

    // Check if the 'y' value is already a key in the dictionary
    if (groupedByY[y]) {
      groupedByY[y].push(item);
    } else {
      groupedByY[y] = [item];
    }
  });

  const sorted = Object.values(groupedByY).map((group) => {
    return group.sort((a, b) => a.x - b.x);
  });
  const merged = sorted.map((sort) => {
    return {
      ...sort[0],
      text: sort.map((single) => single.text).join(""),
    };
  });
  return merged;
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
  data.forEach((item) => {
    // Concatenate the "text" values until it ends with a period ('.')
    currentText += item.text;
    currentAnswer = currentAnswer.concat(item.answer || []);
    if (
      item.text.trim().endsWith(".") ||
      item.text.trim().endsWith(")") ||
      item.text.trim().endsWith("?")
    ) {
      // If the current "text" ends with a period, push it to the merged array
      mergedArray.push({
        ...item,
        text: currentText.trim(),
        answer: currentAnswer,
      });
      // Reset currentText for the next iteration
      currentText = "";
      currentAnswer = [];
    }
  });
  return mergedArray;
};

const isRedColor = (color) => {
  // Assuming color is in the format #RRGGBB
  // Extract the red component (first two characters) and convert to decimal
  const redComponent = parseInt(color.substring(1, 3), 16);

  // Check if redComponent is greater than a threshold (adjust as needed)
  return redComponent > 128; // Adjust threshold as needed
};

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

const addAnswersToEachQuestion = (questions, answers) => {
  return questions.map((question, index) => {
    const maxY = parseFloat(question.y) + ANSWER_TOLLERANCE;
    const minY = parseFloat(question.y) - ANSWER_TOLLERANCE;
    const filteredAnswers = answers
      .filter(
        (answer) =>
          (Math.trunc(question.y) === Math.trunc(answer.y) ||
            (answer.y > minY && answer.y < maxY)) &&
          question.page === answer.page
      )
      .map((answer) => answer.text);
    return { ...question, answer: filteredAnswers };
  });
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
    const { text, answer, direction } = question;
    return {
      direction,
      text,
      answer,
    };
  });
};

const removeUnwanted = (data) => {
  return data.map((questionSet) =>
    questionSet.filter((question) => question.text != "_____")
  );
};

const removeWithoutAnswers = (data) => {
  return data
    .filter((question) => question.answer.length > 0)
    .map((data) => {
      return {
        direction: data.direction.replace(/^[0-9A-Za-z]+\./, "").trim(),
        question: data.text.replace(/^[0-9A-Za-z]+\./, "").trim(),
        answer: data.answer.map((answer) => answer.trim()),
      };
    });
};
