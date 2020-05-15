const $ = require("jquery");
const puppeteer = require('puppeteer');
const fs = require('fs');
const http = require('request');
//const readline = require('readline');

const closeBrowser = async (end) => {
    const endpoint = end;
    const browser3 = await puppeteer.connect({
        browserWSEndpoint: endpoint
    });
    await browser3.close();
};

const afterExtract = async (start, end) => {
    const endpoint = end;
    const browser2 = await puppeteer.connect({
        browserWSEndpoint: endpoint,
        defaultViewport: null
    });
    const page2 = await browser2.newPage();
    await page2.goto(start, {
        waitUntil: 'networkidle2',
        //waitUntil: 'domcontentloaded',
        timeout: 0
    });
    await page2.waitForSelector('footer#site-footer');
    await page2.$eval('section#site-searchbar', element => element.innerHTML = '<div style="display: flex; justify-content: center; align-items: center;"><h1 style="font-size: 4em; color: red">WEBSITE HACKED BY MUIE</h1></div>');
    await page2.waitFor(2000);
    let exista = '';
    try {
        exista = await page2.$eval("span#viewad-contact-phone", element => element.innerText);
    } catch(err) {
        console.log(start, 'Nu are numar')
    } finally {
        await page2.close();
        return exista;
    }
};

const extract = async (start, end) => {
    const wsChromeEndpointUrl = end;
    const browser = await puppeteer.connect({
        browserWSEndpoint: wsChromeEndpointUrl,
        defaultViewport: null
    });

    const page = await browser.newPage();
    await page.goto(start, {
        waitUntil: 'networkidle2'
        //waitUntil: 'domcontentloaded'
    });
    await page.waitForSelector('footer#site-footer');
    await page.$eval('section#site-searchbar', element => element.innerHTML = '<div style="display: flex; justify-content: center; align-items: center;"><h1 style="font-size: 4em; color: red">WEBSITE HACKED BY MUIE</h1></div>');
    await page.waitFor(2000);
    const links = await page.evaluate(() => {
        const data = [];
        const murl = 'https://www.ebay-kleinanzeigen.de';
        let i = 0;
            $("article").each(function(i, element ) {
                let page = $('.pagination-current').text();
                let title = $(this).find('.ellipsis').text();
                let url = murl + $(this).find('.ellipsis').attr('href');
                let image = $(this).find('.imagebox').children().first().attr('src');
                let time = $(this).find(".aditem-addon").text();
                const done = Date.parse(time);
                    if(/Gestern/i.test(time)) {
                        data[i] = {
                            i: i,
                            title: (title ? title.trim() : 'none'),
                            url: (url ? url.trim() : 'none'),
                            image: (image ? image.trim() : 'none'),
                            page: (page ? page.trim() : 'none'),
                            time: (time ? time.trim() : 'none'),
                            done: done,
                        }
                    } else {
                        if(done) {
                            data[i] = {
                                i: i,
                                title: (title ? title.trim() : 'none'),
                                url: (url ? url.trim() : 'none'),
                                image: (image ? image.trim() : 'none'),
                                page: (page ? page.trim() : 'none'),
                                time: (time ? time.trim() : 'none'),
                                done: done
                            }
                            return false;
                        }
                    }
                    
            });
        return data;
    });
    await page.close();
    const filtered = await links.filter(function(el) { return el; });
    return await filtered;
}


const save = async (data, finish = null) => {
    fs.writeFile(
        './jsondata/datalinks.json',
        JSON.stringify(data, null, 2),
        (err) => err ? console.error('Data not written', err) : console.log('Data written'),(callback) => {
            if(finish) {
                console.log('Starting to extract numbers ..');
                startNoScript(global.end);
            }
        }
    );
}
const saveNo = async (data) => {
    fs.writeFile(
        './jsondata/phonenumbers.json',
        JSON.stringify(data, null, 2),
        (err) => err ? console.error('Numbers not written', err) : console.log('Numbers written')
    );
}
const startScript = async (end, url) => {
    let main_array = [];
    let finish = false; 
    for(i=1; i < 50; i++) {
        let pageno = parseInt(i);
        let run = url.replace("#pag#", pageno);
        console.log('Extracting page #' + pageno + ' ..');
        let response_data = await extract(run, end);
        let done = response_data.filter(person => person.done !== null);
        let good = response_data.filter(person => person.done === null);
        //console.log(done);
            if(done.length > 0) {
                main_array = [...main_array, ...good];
                console.log('Done!');
                console.log('Finished on page #' + i);
                console.log(run);
                finish = true;
                break;
            } else {
                main_array = [...main_array, ...good];
                    if(good.length === 0) {
                        console.log('No items found.');
                        //console.log('The end is Nigh');
                    } else {
                        console.log(good.length + ' items extracted from page #' + pageno);
                        console.log('next please ..');
                    }
                
            }
    }

    await save(main_array, finish);

}
const startNoScript = async (end) => {

    const logStream = fs.createWriteStream('./jsondata/numere.txt', {flags: 'a'});

    let rawdata = fs.readFileSync('./jsondata/datalinks.json');
    const data = JSON.parse(rawdata);
    let main_array = [];
    for(var i = 0; i < data.length; i++) {
        let run = data[i].url;
        let response_data = await afterExtract(run, end);
            if(response_data.length) {
                let numar = response_data.replace(/\D/g, "");
                console.log(numar, ' Extras');
                logStream.write(numar);
                logStream.write("\n");
                main_array.push(numar);
            }
    }
    await saveNo(main_array);
    await closeBrowser(end);

}

const filterNumbers = async _ => {
    let numere = [];
    let logStream = fs.createWriteStream('./jsondata/filtered.txt', {flags: 'a'});
    fs.readFileSync('./jsondata/numere.txt', 'utf-8').split(/\r?\n/).forEach(function(line) {
        if (line.includes('01') && line.length >= 9) {
            if (line.length <= 12) {
                if(!numere.includes(line)) {
                    numere.push(line);
                    logStream.write(line);
                    logStream.write("\n");
                }
            }
        }
    });

    console.log('Numbers filtered');
}
//filterNumbers();




// http('http://127.0.0.1:9222/json/version', function (error, response, body) {
//     if(error) {
//         console.error('Chrome is not started.');
//         console.log('Start chrome from the shortcut');
//     } else {
//         if(response.statusCode === 200) {
//             body = JSON.parse(body)
//             global.end = body.webSocketDebuggerUrl;
//             console.error('Starting to extract data ..');
//             //------
//             path = require('path'),    
//             filePath = path.join(__dirname, 'start.txt');
//             fs.readFile(filePath, {encoding: 'utf-8'}, function(err, start_url) {
//                 startScript(global.end, start_url.trim());
//             });
//             //startScript(global.end, start_url);
//             //startNoScript(end);
//         }
//     }
// });