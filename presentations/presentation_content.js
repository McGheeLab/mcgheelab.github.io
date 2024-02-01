const accodian_contentData = [
    {
        class: "T1",
        heading: "Microfluidics",
        reading: "The test bed for our 3D printing platform, we develop μ-fluidic chips for injury, creation of cell embedded droplets printing media, and more."
    },
    {
        class: "T2",
        heading: "3D bioprinting",
        reading: "Cell Embedded Liquid Like Solid (CELLS) bioink is created via droplet emulsion and deposited into LLS via freeform 3D printing methods."
    },
    {
        class: "T3",
        heading: "Migration Assay",
        reading: "As cells migrate through the LLS, we can track their movement and interaction with other cells and the LLS. Cells with interesting behaviors can be removed without disturbing the rest of the model."
    },
    {
        class: "T4",
        heading: "In Situ ELISA",
        reading: "Real time readouts of cell activity can be achieved within 3D printed models via dispursed bead-based ELISA within the LLS."
    },
    {
        class: "T5",
        heading: "Tissue Mechanics",
        reading: "We study the interaction of external stress on biolocgical tissue samples."
    },

];

const presentation_contentData = {
    content1: [
        {
            imgSrc: "Images/T2.png",
            title: "Intro",
            description: "Microfluidics"
        },
        {
            imgSrc: "Images/T2.png",
            title: "Problem",
            description: "Volume"
        },
        {
            imgSrc: "Images/T3.png",
            title: "Need",
            description: "Fabrication"
        },
        {
            imgSrc: "Images/T4.png",
            title: "Method",
            description: "Device description here"
        },
        {
            imgSrc: "Images/T5.png",
            title: "Result",
            description: "device in action"
        },
    ],
    content2: [
        {
            imgSrc: "Images/T2.png",
            title: "Intro",
            description: "3D printing"
        },
        {
            imgSrc: "Images/T1.png",
            title: "Problem",
            description: "Stuff"
        },
        {
            imgSrc: "Images/T3.png",
            title: "Need",
            description: "make tissues"
        },
        {
            imgSrc: "Images/T4.png",
            title: "Method",
            description: "LLS"
        },
        {
            imgSrc: "Images/T5.png",
            title: "Result",
            description: "device in action"
        },
        
    ],
    content3: [
        {
            imgSrc: "Images/T2.png",
            title: "Intro",
            description: "migration assay"
        },
        {
            imgSrc: "Images/T3.png",
            title: "Problem",
            description: "Stuff"
        },
        {
            imgSrc: "Images/T3.png",
            title: "Need",
            description: "make tissues"
        },
        {
            imgSrc: "Images/T4.png",
            title: "Method",
            description: "LLS"
        },
        {
            imgSrc: "Images/T5.png",
            title: "Result",
            description: "device in action"
        },
        
    ],
    content4: [
        {
            imgSrc: "Images/T2.png",
            title: "Intro",
            description: "3D printing"
        },
        {
            imgSrc: "Images/T1.png",
            title: "Problem",
            description: "Stuff"
        },
        {
            imgSrc: "Images/T3.png",
            title: "Need",
            description: "make tissues"
        },
        {
            imgSrc: "Images/T4.png",
            title: "Method",
            description: "LLS"
        },
        {
            imgSrc: "Images/T5.png",
            title: "Result",
            description: "device in action"
        },
        
    ],
    content5: [
        {
            imgSrc: "Images/T2.png",
            title: "Intro",
            description: "3D printing"
        },
        {
            imgSrc: "Images/T1.png",
            title: "Problem",
            description: "Stuff"
        },
        {
            imgSrc: "Images/T3.png",
            title: "Need",
            description: "make tissues"
        },
        {
            imgSrc: "Images/T4.png",
            title: "Method",
            description: "LLS"
        },
        {
            imgSrc: "Images/T5.png",
            title: "Result",
            description: "device in action"
        },
        
    ],
};

function populateAccordion() {
    const accordion = document.querySelector('.accordion');
    if (!accordion) return;

    accodian_contentData.forEach((item, index) => {
        // Find the corresponding accordion item
        const accordionItem = accordion.querySelector(`.accordion--item.${item.class}`);
        if (!accordionItem) return;

        // Update the heading
        const headingElement = accordionItem.querySelector('.Heading .Heading_box p');
        if (headingElement) headingElement.innerText = item.heading;

        // Update the reading
        const readingElement = accordionItem.querySelector('.readings .readings_box p');
        if (readingElement) readingElement.innerText = item.reading;
    });
}

function populate_presentation_content() {
    // For each content container (content1, content2, ...)
    for (const contentId in presentation_contentData) {
        const content = document.getElementById(contentId);
        if (!content) continue;

        // For each division in the container
        presentation_contentData[contentId].forEach((division, index) => {
            const divisionElement = content.getElementsByClassName('division')[index];
            if (!divisionElement) return;

            // Update the image
            const imgElement = divisionElement.querySelector('.image_media img');
            if (imgElement) {
                imgElement.src = division.imgSrc;
                imgElement.alt = division.title;  // Update alt text if required
            }

            // Update the title and description
            const titleElement = divisionElement.querySelector('.description_media h2');
            const descElement = divisionElement.querySelector('.description_media p');
            if (titleElement) titleElement.innerText = division.title;
            if (descElement) descElement.innerText = division.description;
        });
    }
}

// Add event listeners for window load
window.addEventListener('load', populateAccordion);
window.addEventListener('load', populate_presentation_content);
