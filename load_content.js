import { sharedContent } from './content.js';

function populateContent() {
    document.getElementById('title').innerText = sharedContent.title;
    document.getElementById('text').innerText = sharedContent.text;
    document.getElementById('image').src = sharedContent.imageUrl;

    const list = document.getElementById('list');
    sharedContent.listItems.forEach(item => {
        const li = document.createElement('li');
        li.innerText = item;
        list.appendChild(li);
    });
}

window.onload = populateContent;
