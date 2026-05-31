// 全局变量：存储当前语言数据
let currentLangData = {};
// 默认语言
const DEFAULT_LANG = "cn";
// JSON 文件路径
const LANG_PATH = "./lang/";

/**
 * 加载指定语言的JSON文件
 * @param {string} lang - 语言标识（cn/en/jp）
 */
async function loadLangFile(lang) {
  try {
    console.log(`尝试加载语言包: ${lang}`);
    
    // 发起请求加载JSON
    const response = await fetch(`${LANG_PATH}${lang}.json`);
    
    // 检查请求是否成功
    if (!response.ok) {
      throw new Error(`加载失败：${response.status} (${lang}.json)`);
    }
    
    // 解析JSON数据
    currentLangData = await response.json();
    console.log(`成功加载 ${lang} 语言包:`, currentLangData);
    
    // 渲染文本到页面
    renderLangContent();
    
    // 更新HTML lang属性
    document.documentElement.lang = lang === "cn" ? "zh-CN" : lang === "en" ? "en" : "ja";
    
    // 保存到本地存储
    localStorage.setItem("preferred-lang", lang);
    
    // 同步所有语言选择器的值（但不触发change事件）
    syncLanguageSelectors(lang, false);
    
  } catch (error) {
    console.error("语言包加载失败：", error);
    
    // 如果当前不是中文且加载失败，尝试加载中文
    if (lang !== "cn") {
      console.log("尝试加载默认中文包...");
      loadLangFile("cn");
    }
  }
}

/**
 * 将语言数据渲染到页面元素
 */
function renderLangContent() {
  if (!currentLangData || Object.keys(currentLangData).length === 0) {
    console.warn("语言数据为空");
    return;
  }
  
  console.log("开始渲染语言内容，数据:", currentLangData);
  
  // 遍历所有带 data-i18n 属性的元素
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    const translation = currentLangData[key];
    
    if (!translation) {
      // console.warn(`未找到键值: ${key}`);
      return;
    }
    
    // 根据元素类型设置内容
    if (element.tagName === 'TITLE') {
      // 设置 title 元素的内容
      element.textContent = translation;
      // 同时更新 document.title
      document.title = translation;
      console.log(`更新标题为: ${translation}`);
    } else {
      // 普通元素：根据是否包含HTML标签决定用 innerHTML 还是 textContent
      if (translation.includes('<') && translation.includes('>')) {
        element.innerHTML = translation;
      } else {
        element.textContent = translation;
      }
    }
  });
  
  console.log("页面内容更新完成，当前标题:", document.title);
}

/**
 * 同步所有语言选择器的值
 * @param {string} lang 
 * @param {boolean} triggerEvent - 是否触发change事件
 */
function syncLanguageSelectors(lang, triggerEvent = false) {
  const selectors = document.querySelectorAll('.language-selector, #lang-select, #mobile-language-selector, #footer-language-selector');
  selectors.forEach(selector => {
    if (selector) {
      selector.value = lang;
    }
  });
}

/**
 * 初始化所有语言选择器监听
 */
function initLangSelectors() {
  // 获取所有语言选择器
  const selectors = document.querySelectorAll('.language-selector, #lang-select, #mobile-language-selector, #footer-language-selector');
  
  if (selectors.length === 0) {
    console.warn("未找到语言选择器元素");
    return;
  }
  
  // 先移除所有已有的事件监听（避免重复）
  selectors.forEach(selector => {
    const newSelector = selector.cloneNode(true);
    selector.parentNode.replaceChild(newSelector, selector);
  });
  
  // 重新获取新克隆的选择器
  const newSelectors = document.querySelectorAll('.language-selector, #lang-select, #mobile-language-selector, #footer-language-selector');
  
  // 添加新的事件监听
  newSelectors.forEach(selector => {
    selector.addEventListener('change', handleLanguageChange);
  });
  
  console.log(`已初始化 ${newSelectors.length} 个语言选择器`);
}

/**
 * 语言切换处理函数
 */
function handleLanguageChange(e) {
  const selectedLang = e.target.value;
  console.log(`语言切换至: ${selectedLang}`);
  loadLangFile(selectedLang);
}

/**
 * 获取用户偏好语言
 */
function getPreferredLang() {
  // 1. 从本地存储获取
  const savedLang = localStorage.getItem("preferred-lang");
  if (savedLang && ["cn", "en", "jp"].includes(savedLang)) {
    console.log(`使用本地存储的语言: ${savedLang}`);
    return savedLang;
  }

  // 2. 从浏览器语言获取
  const browserLang = navigator.language || navigator.userLanguage;
  console.log(`浏览器语言: ${browserLang}`);
  
  if (browserLang.includes("zh")) return "cn";
  if (browserLang.includes("en")) return "en";
  if (browserLang.includes("ja")) return "jp";

  // 3. 默认语言
  console.log(`使用默认语言: ${DEFAULT_LANG}`);
  return DEFAULT_LANG;
}

/**
 * 检查JSON文件是否可访问（调试用）
 */
async function checkJsonFiles() {
  const langs = ['cn', 'en', 'jp'];
  
  for (const lang of langs) {
    try {
      const response = await fetch(`${LANG_PATH}${lang}.json`, { method: 'HEAD' });
      console.log(`${lang}.json: ${response.ok ? '✅ 可访问' : '❌ 不可访问'} (${response.status})`);
    } catch (error) {
      console.error(`${lang}.json: ❌ 加载失败`, error);
    }
  }
}

// 页面加载完成后初始化
document.addEventListener("DOMContentLoaded", async () => {
  console.log("DOM加载完成，初始化语言系统...");
  
  // 调试：检查JSON文件
  await checkJsonFiles();
  
  // 获取偏好语言
  const initialLang = getPreferredLang();
  console.log(`初始语言: ${initialLang}`);
  
  // 先加载语言包
  await loadLangFile(initialLang);
  
  // 最后初始化选择器监听（确保选择器值已经设置好）
  initLangSelectors();
});

// 暴露全局函数（方便调试）
window.loadLangFile = loadLangFile;
window.getCurrentLangData = () => currentLangData;
window.checkJsonFiles = checkJsonFiles;
window.refreshTranslation = () => renderLangContent();
window.forceReloadLang = (lang) => {
  console.log(`强制重新加载语言: ${lang}`);
  loadLangFile(lang);
};