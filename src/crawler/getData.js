const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

let scrape = async () => {
    const browser = await puppeteer.launch({headless: true, devtools: false});
    const page = await browser.newPage();
    await page.evaluateOnNewDocument(() => { //在每个新页面打开前执行以下脚本
        const newProto = navigator.__proto__;
        delete newProto.webdriver;  //删除navigator.webdriver字段
        navigator.__proto__ = newProto;
        Object.defineProperty(navigator, 'userAgent', {  //userAgent在无头模式下有headless字样，所以需覆写
            get: () => "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.113 Safari/537.36",
        });
    })
    await page.goto('http://www.nhc.gov.cn/xcs/yqjzqk/list_gzbd.shtml');
    await page.waitForSelector(".zxxx_list>li");

    const days = await page.evaluate(() => {
        return [].slice.call(document.querySelectorAll(".zxxx_list>li")).slice(0,3).map(
            li => {
                // return li.innerText
                let href = li.children[0].href;
                let date = li.children[1].innerText;
                return {
                    date,
                    href,
                }
            }
        );
    });

    const list = []
    for await (let day of days) {
        const {href} = day;
        await page.goto(href)
        await page.waitForSelector("#xw_box");
        const dayNew = await page.evaluate(() => {
            let original = document.querySelector("#xw_box").innerText.replaceAll("\n","")
            let match = original.match(/((\d+(\.\d+)?)万)/);
            const count = match ? match[2] : 0;
            return {
                count,
                original
            }
        });
        list.push({
            ...day, ...dayNew
        });
    }

    await browser.close();
    return list;
};

scrape().then((value) => {
    let filePath = path.join(__dirname, '../../public/data.json');
    let list = JSON.parse(fs.readFileSync(filePath, "utf8")) || [];
    let dates = list.map(day => day.date) || [];
    console.log(value);
    list = list.concat(value.filter(day => {
        return !dates.includes(day.date)
    }))
    list.sort((a, b) => a.count - b.count)
    fs.writeFileSync(filePath, JSON.stringify(list))
}).catch(
    // err => console.error(err)
)
