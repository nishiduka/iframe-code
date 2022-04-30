window.onload = function () {
  let container = document.querySelector('[data-iframe-container]');

  let iframeRaw = null;
  let iframe = null;
  let iframeDocument = null;

  const htmlCode = document.querySelector('[data-code-html]');
  const cssCode = document.querySelector('[data-code-css]');
  const javascriptCode = document.querySelector('[data-code-javascript]');
  const consoleContainer = document.querySelector('[data-iframe-console]');
  const buttonClearConsole = document.querySelector('[data-iframe-clear]');

  function generateIframe() {
    consoleContainer.innerHTML = '';
    container.innerHTML = '';

    iframeRaw = document.createElement('iframe');
    container.appendChild(iframeRaw);

    iframe = iframeRaw.contentWindow || iframeRaw;
    iframeDocument = iframe.contentDocument || iframe.document;
  }

  /**
   *
   * @param {string} contentHTMLString
   */
  function updateContentHTML(contentHTMLString) {
    if (!contentHTMLString) {
      contentHTMLString = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta http-equiv="X-UA-Compatible" content="IE=edge"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Document</title></head><body></body></html>`;
    }

    iframeDocument.open();
    iframeDocument.write(contentHTMLString);
  }

  /**
   *
   * @param {string} contentJavascriptString
   */
  function updateContentJavascript(contentJavascriptString) {
    const script = iframeDocument.createElement('script');

    script.append(overwriteConsoleLog(contentJavascriptString));
    // script.append(contentJavascriptString);

    iframeDocument.documentElement.appendChild(script);
  }

  function updateContentCss(contentCssString) {
    const style = iframeDocument.createElement('style');

    style.append(contentCssString);

    iframeDocument.documentElement.querySelector('head').appendChild(style);
  }

  function updateFromAllFields() {
    generateIframe();

    updateContentHTML(htmlCode.value);

    if (javascriptCode.value) {
      updateContentJavascript(javascriptCode.value);
    }

    if (cssCode.value) {
      updateContentCss(cssCode.value);
    }

    iframeDocument.close();
  }

  /**
   *
   * @param {string} jsFunction
   * @returns
   */
  function overwriteConsoleLog(jsFunction) {
    return `window.onload = function () {
      const _log = console.log;
      console.log = function(...rest) {
        try {
          window.parent.postMessage(
            {
              source: 'iframe',
              message: {
                message: JSON.parse(JSON.stringify(rest)),
                type: 'info'
              },
            },
            '*'
          );
          _log.apply(console, arguments);
        } catch(e) {
          window.parent.postMessage(
            {
              source: 'iframe',
              message: {
                message: ['ocorreu um erro ao tentar exibir a mensagem do console'],
                type: 'error'
              },
            },
            '*'
          );
          _log.apply(console, arguments);
        }
      }
    
      ${jsFunction}
    }`;
  }

  /**
   *
   * @param {*} response
   */
  function getConsoleLog(response) {
    if (response.data && response.data.source === 'iframe') {
      const span = document.createElement('span');

      let text = '> ';
      for (
        let index = 0;
        index < response.data.message.message.length;
        index++
      ) {
        const element = response.data.message.message[index];

        if (typeof element == 'object') {
          text +=
            (JSON && JSON.stringify ? JSON.stringify(element) : element) +
            '<br />';
        } else {
          text += element + '<br />';
        }
      }
      span.innerHTML = text;

      if (response.data.message.type === 'error') {
        span.classList.add('error');
      }

      consoleContainer.appendChild(span);
    }
  }

  function addListeners() {
    htmlCode.addEventListener('input', () => {
      updateFromAllFields();
    });

    cssCode.addEventListener('input', () => {
      updateFromAllFields();
    });

    javascriptCode.addEventListener('input', () => {
      updateFromAllFields();
    });

    buttonClearConsole.addEventListener('click', () => {
      consoleContainer.innerHTML = '';
    });

    window.addEventListener('message', getConsoleLog);
  }

  updateFromAllFields();
  addListeners();
};
