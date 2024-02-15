const accodian_contentData = [
    {
        class: "T1",
        heading: "Microfluidics",
        reading: "The test bed for our 3D printing platform, we develop microfluidic chips for cell embedded liquid like solid (CELLS) bioink, organoid injury on a chip, and more."
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
            imgSrc: "Images/Microfluidic_Overview-01.png",
            title: "Microfluidics",
            description: "We utilize microfluidic dropplet generation to create Cell Embedded Liquid Like Solid (CELLS) bioink. This bioink is then deposited into Blank-LLS via freeform 3D printing methods within a chip designed to injury the resulting tissue."
        },
        {
            imgSrc: "Images/Microfluidic_Droplet-02.png",
            title: "Droplet Generation",
            description: "In microfluidic droplet emulsion processes, an aqueous cell suspension and an oil phase are introduced into a microfluidic device. Due to the Rayleigh-Plateau instability, the interface between the two liquids becomes unstable at certain flow rates, leading to the breakup of the aqueous phase into uniform droplets that encapsulate the cells. These dropplets are then removed from the oil phase and collected to be used as bioink."
        },
        {
            imgSrc: "Images/Microfluidic_Injury chip-03.png",
            title: "Injury",
            description: "A second microfluidic chip is used to allow for perfusive flow through the CELLS while maintaning optical access. After cells are cultured for enough time to develop a complex tissue, we induce injury via multiple methods including laser induced cavitation, localized radiation, and mechanical probes. "
        },
        {
            imgSrc: "Images/Microfluidic_underoil-05.png",
            title: "Under oil cell sorting",
            description: "Our microscope enabled pick-and-place system allows for precise placement and manipulation of cells in conjunction with under oil microfluidic platforms.",
            link: "https://doi.org/10.1002/advs.202104510",
            linkname: "Learn more about under oil cell sorting"
        },
        {
            imgSrc: "none",
            title: " ",
            description: " "
        },
    ],
    content2: [
        {




            imgSrc: "Images/Bioprinting-01.png",
            title: "Microscope enabled 3D printing",
            description: "We develop 3D printing divices that integrate with inverted microscopes to allow for real time monitoring an manipulation of the printing process. This allows for precise placement of cells and other materials within the LLS.",
            link: "https://doi.org/10.1126/sciadv.1500655",
            linkname: "Learn more about freeform 3D printing in LLS"
        },
        {
            imgSrc: "Images/Bioprinting-01-02.png",
            title: "Deposition in LLS",
            description: "CELLS bioink is deposited into Blank-LLS via freeform 3D printing methods. This allows for the creation of complex tissue models with precise control over the placement of cells and other materials."
        },
        {
            imgSrc: "Images/Bioprinting-01-03.png",
            title: "CELLS bioink",
            description: "Each cell type is encapsulated in a unique type of ECM that is taylored to its phenotype. When 3D printed in LLS, the various CELLS are structured to form a tissue with complete control over the local ECM.  ."
        },
        {
            imgSrc: "none",
            title: " ",
            description: " "
        },
        {
            imgSrc: "none",
            title: " ",
            description: " "
        },
        
    ],
    content3: [
        {
            imgSrc: "Images/Migration-01.png",
            title: "Cell Migration Assay",
            description: "Within the interstitial space of the LLS, cells can migrate and interact with other cells. We can track their movement and to clasify their behavior. "
        },
        {
            imgSrc: "Images/Migration-02.png",
            title: "Cell sorting and removal",
            description: "Cells with interesting behaviors can be removed and binned into separate containers without disturbing the rest of the model. Omic data can be collected from these cells to understand the molecular basis of their behavior."
        },
        {
            imgSrc: "Images/MigrationAssay (3).png",
            title: "Injury and migration",
            description: "3D printed tissues once injured release signals that attract cells to the injury site. We can track the migration of these cells and their interaction with the injured tissue while sensing the resulting biochemical gradient via in-situ ELISA."
        },
        {
            imgSrc: "none",
            title: "",
            description: ""
        },
        {
            imgSrc: "none",
            title: "",
            description: ""
        },
        
    ],
    content4: [
        {
            imgSrc: "Images/ELISA-01.png",
            title: "In Situ ELISA",
            description: "Real time readouts of cell activity can be achieved within 3D printed models via dispursed bead-based ELISA within the LLS. This allows for correlation of biochemical gradients to the response of migrating cells in these gradients."
        },
        {
            imgSrc: "Images/ELISA-02.png",
            title: "Experimental data",
            description: "An osteosarcoma tumor model was created using 3D printing and the resulting biochemical gradients were measured using in-situ ELISA. The resulting data showed the concentration gradient of IL-8 as a function of time, taken together we are able to measure the upregulation of cytokines via changes in the concentration gradient.",
            link: "http://dx.doi.org/10.1007/s44164-022-00037-6",
            linkname: "Learn more about in-situ ELISA"
        },
        {
            imgSrc: "none",
            title: "",
            description: ""
        },
        {
            imgSrc: "none",
            title: "",
            description: ""
        },
        {
            imgSrc: "none",
            title: "",
            description: ""
        },
        
    ],
    content5: [
        {
            imgSrc: "Images/Mechanics-01.png",
            title: "Laser induced cavitation",
            description: "A high power laser is focused into the LLS to create a cavitation bubble. This bubble can be used to create a localized injury in the tissue model. However, we must first understand the mechanical response of the ECM and tissue in order to create a controlled injury.",
            link: "https://doi.org/10.1007/s11340-022-00893-z",
            linkname: "Learn more about inertial microcavitation measurements"
        },
        {
            imgSrc: "Images/Mechanics-02.png",
            title: "Thermal injury",
            description: "Localized heating of the tissues can be used to create a thermal injury in the tissue model. we can monitor the response of the tissue in real time via 2D Digital image correlation to build spatial maps of the coefficient of thermal expansion of various organs.",
            link: "https://doi.org/10.21203/rs.3.rs-3570022/v1",
            linkname: "Learn more about the coefficient of thermal expansion of tissues"
        },
        {
            imgSrc: "Images/Mechanics-03.png",
            title: "Microfluidic injury chip",
            description: "Microfluidic chips designed to injure organoids are used in conjunction with in-situ ELISA to monitor the biochemical signature of various organ systems in real time.",

        },
        {
            imgSrc: "none",
            title: "",
            description: ""
        },
        {
            imgSrc: "",
            title: "",
            description: ""
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

                // Hide the image if no image is provided
                if (division.imgSrc === "none" || division.imgSrc === "" || division.imgSrc === " ") imgElement.style.display = "none";
            }

            // Update the title and description
            const titleElement = divisionElement.querySelector('.description_media h2');
            const descElement = divisionElement.querySelector('.description_media p');
            if (titleElement) titleElement.innerText = division.title;
            if (descElement) {
                descElement.innerText = division.description;
                if (division.link) {
                    const linkElement = document.createElement('a');
                    linkElement.href = division.link;
                    linkElement.innerText = division.linkname || "Link";
                    linkElement.target = "_blank"; // Open link in a new tab
                    descElement.appendChild(document.createElement('br')); // Add a newline
                    descElement.appendChild(linkElement);
                }
            }
        });
    }
}

// Add event listeners for window load
window.addEventListener('load', populateAccordion);
window.addEventListener('load', populate_presentation_content);
