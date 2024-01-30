const ANSWER_COLOR = "#FF0000";
const ANSWER_TOLLERANCE = 8;

// const getDirections = (data) => {
//   const directions = data.filter((answer) =>
//     isFillInTheBlanksDirection(answer)
//   );
//   return directions;
// };

const getDirectionIndexes = (data) => {
  const directionIndexes = data
    .map((direction, directionIndex) => {
      if (isFillInTheBlanksDirection(direction.text)) return direction.index;
      return null; // Return null for indexes that don't meet the condition
    })
    .filter((index) => index !== null); // Filter out null values

  return directionIndexes;
};

const getQuestionsSet = (data, directions, directionIndexes) => {
  let questionsSet = [];
  let singleSet = [];
  directionIndexes.forEach((direction, outerIndex) => {
    if (outerIndex < directionIndexes.length - 1) {
      singleSet = [];
      for (
        let index = direction;
        index < directionIndexes[outerIndex + 1];
        index++
      ) {
        singleSet.push({
          ...data[index],
          direction: directions[outerIndex].text,
        });
      }
      questionsSet.push(singleSet);
    } else {
      singleSet = [];
      for (let index = direction; index < data.length; index++) {
        singleSet.push({
          ...data[index],
          direction: directions[outerIndex].text,
        });
      }
      questionsSet.push(singleSet);
    }
  });
  return questionsSet;
};

const isFillInTheBlanksDirection = (input) => {
  const regexEn =
    /(?:Fill\s*in\s*the\s*blank?|Fill\s*up\s*the\s*blank?|Fill\s*in\s*the\s*horizontal\s*line?|Complete\s*the\s*following?|Complete\s*the\s*sentences?|Insert\s*the\s*correct\s*words?|Insert\s*the?|Choose\s*the\s*right\s*words?|Choose\s*the?|Add\s*the\s*necessary\s*information?|Add\s*the\s*missing?|Add\s*the\s*correct?|Supply\s*the\s*missing\s*words?)(?:.*)/i;
  const regexCn =
    /(?:填空|填充|填寫空白|填寫橫線|完成下列|完成句子|插入正確的詞語|插入|選擇正確的詞語|選擇|添加必要的信息|添加缺失的|添加正確的|補充缺失的詞語|填在橫線上|選詞填充|選擇適當的詞語|選擇適當的答案|填在____上|填寫在空白格上|填上適當的答案|填上適當的詞語|填在_____上|填在空白線上|回答以下問題|回答問題|在_____上填寫答案|在_____填寫正確答案|在_____填寫適當的答案|在_____填寫適當答案|運用提供的字詞|運用提供的詞語|完成問題|完成答案|上填上適)[\u4e00-\u9fa5]*(?:.*)/i;

  return regexCn.test(input) || regexEn.test(input);
};

const refineColumns = (page) => {
  return page.row.map((row) => ({
    column: Array.isArray(row.column) ? row.column : [row.column],
  }));
};

const getAnswers = (page, pageNumber) => {
  let result = [];
  page.forEach((row) => {
    row.column.forEach((column) => {
      if (
        column.text.color == ANSWER_COLOR ||
        column.text.color == "#FB0106" ||
        (column.text.fontStyle === "Underline" &&
          countDashes(column.text.text) < 2)
      ) {
        result.push({ ...column.text, pageNumber });
      }
    });
  });
  return result;
};

function countDashes(str, charToCount = "_") {
  let count = 0;

  for (let i = 0; i < str.length; i++) {
    if (str[i] === charToCount) {
      count++;
    }
  }

  return count;
}

const removeAnswers = (page) => {
  const filteredData = page.map((subarray) =>
    subarray.filter((item) => !item.color || item.color !== ANSWER_COLOR)
  );
  return filteredData;
};

const refineSentences = (data) => {
  const refined = data.filter(
    (sentence) => countWords(sentence.text) != 1 && sentence.text.length > 7
  );

  let currentSentence = "";
  const resultArray = [];

  for (const obj of refined) {
    currentSentence += obj.text;

    if (obj.eol) {
      resultArray.push({ text: currentSentence, eol: true, y: obj.y });
      currentSentence = "";
    }
  }
  return resultArray;
};

function countWords(str) {
  // Match words using a regular expression
  const words = str.match(/\b\w+\b/g);

  // Return the count of matched words
  return words ? words.length : 0;
}

const addLineEndInColumns = (page) => {
  let result = page.map((row) =>
    row.column.map((obj) => {
      if (obj?.text?.text) {
        return {
          ...obj.text,
          text:
            obj?.text?.fontStyle == "Underline"
              ? "__________"
              : obj?.text?.text,
          eol:
            obj.text?.text?.trim().endsWith(".") ||
            obj.text?.text?.trim().endsWith("。") ||
            obj.text?.text?.trim().endsWith(")"),
        };
      } else {
        return {
          ...obj,
        };
      }
    })
  );

  return result;
};

const replaceUnderline = (page) => {
  let result = page.map((row) =>
    row.column.map((obj) => {
      if (obj?.text?.text) {
        return {
          ...obj.text,
          text:
            obj?.text?.fontStyle === "Underline"
              ? "___________"
              : obj?.text?.fontStyle,
        };
      } else {
        return {
          ...obj,
        };
      }
    })
  );
  return result;
};

const concatinateColumns = (row, pageNumber) => {
  const column = row.map((column) => {
    const columnElement = column.find((item) => item.y);
    return {
      text: column.map((text) => text?.text).join(" "),
      eol: column.some((item) => item.eol),
      pageNumber: pageNumber,
      y: [
        ...new Set(
          column.map((text) => text?.y).filter((text) => text != null)
        ),
      ],
    };
  });
  //   Remove underscores from the end of the line
  return column.map((line) => {
    return {
      text: line.text,
      pageNumber,
      eol: line.eol,
      y: line.y,
    };
  });
};

const trimify = (rows) => {
  return rows.map((row) => {
    return {
      ...row,
      text: row.text.trim().replace(/\s{2,}/g, " "),
    };
  });
};

const refineQuiz = (quiz) => {
  return quiz
    .map((object) => {
      return {
        direction: "",
        question: object.text,
        answer: object.answer,
      };
    })
    .filter((object) => object.answer.length > 0);
};
