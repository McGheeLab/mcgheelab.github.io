let accordionItems = document.querySelectorAll('.accordion .accordion--item');
let contentSections = document.querySelectorAll('#content-container .content');

accordionItems.forEach(item => {
    item.addEventListener('click', () => {
        // Close all accordion items
        accordionItems.forEach(i => {
            i.classList.remove('opened');
        });

        // Open clicked accordion item
        item.classList.add('opened');

        // Hide all content sections
        contentSections.forEach(content => {
            content.classList.remove('active');
        });

        // Get corresponding content ID
        let contentId = item.getAttribute('data-content');

        // Show the content linked to the opened accordion
        let contentToShow = document.getElementById(contentId);
        if (contentToShow) {
            contentToShow.classList.add('active');
        }
    });
});


    // get all of the divisions
let divisions = document.querySelectorAll('.division');

// Function to animate the entry using the timeline
function animateEntry(entry) {
    let media = entry.querySelector('.image_media');
    let description = entry.querySelector('.description_media');

    // create a timeline for the entry with ScrollTrigger 
    let tl = gsap.timeline({
        scrollTrigger: {
            trigger: entry,
            start: 'top 60%',
            end: 'bottom 90%',
            scrub: true,
            // markers: true,
            toggleActions: 'play none none reverse'
        }
    });

    // animate the entry using the above timeline
    tl.fromTo(description, { xPercent: 100, opacity: 0 }, { xPercent: 0, opacity: 1 });
    tl.fromTo(media, { xPercent: -100, opacity: 0 }, { xPercent: 0, opacity: 1 }, '<'); // '<' means run at the same time as the previous animation
}

// Loop through the initial divisions and animate them
divisions.forEach(entry => {
    animateEntry(entry);
});

// when the accordion is clicked, redo the animation on the divisions
accordionItems.forEach(item => {
    item.addEventListener('click', () => {
        divisions.forEach(entry => {
            animateEntry(entry);
        });
    });
});