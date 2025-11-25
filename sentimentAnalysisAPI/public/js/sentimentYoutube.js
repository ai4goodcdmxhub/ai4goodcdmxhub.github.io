    const delay = 100;

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    document.getElementById("startAnalysisBtn").addEventListener("click", async () => {
        const container = document.getElementById("videosContainer");
        container.innerHTML = "<p class='text-info'>Cargando videos...</p>";

        const res = await fetch('/api/ia-mexico/videos');
        const data = await res.json();
        const videos = Array.isArray(data) ? data : data.videos;

        container.innerHTML = "";  // limpiar

        for (const v of videos) {
            await sleep(delay);

            const cardHTML = `
            <div class="col">
                <div class="card video-card">
                <img src=${v.thumbnail} class="card-img-top"/>
                <div class="card-body">
                    <h6 class="video-title">${v.title}</h6>
                </div>
                </div>
            </div>
            `;

            container.insertAdjacentHTML("beforeend", cardHTML);
        }

        loadCommentsForVideos(videos);

    });





    async function loadCommentsForVideos(videos) {
        const commentsBox = document.getElementById("commentsBox");
        const analysisBox = document.getElementById("analysisResults");

        commentsBox.innerHTML = "<p class='text-info'>Cargando comentarios...</p>";
        analysisBox.innerHTML = "<p class='text-info'>Analizando sentimiento...</p>";

        // commentsBox.innerHTML = ""; // limpiar

        let totalScore = 0;
        let totalComments = 0;

        let positives = 0;
        let neutrals = 0;
        let negatives = 0;

        let mostNegScore = 0;
        let mostNegText = '';
        let mostPosScore = 0;
        let mostPosText = '';
        
        commentsBox.innerHTML = ""; 

        for (const v of videos) {
            try {
                const res = await fetch(`/api/ia-mexico/comments/${v.id}`);
                const data = await res.json();

                const FirstComment = data[0].text || "Sin comentarios";

                commentsBox.insertAdjacentHTML(
                    "beforeend",
                    `
                    <div class="comment-card">
                        <p class="comment-title">${v.title}</p>
                        <p>${FirstComment}</p>
                    </div>
                    `
                );

                for (const comment of data) {
                    const sentimentRes = await analyzeComment(comment.text);
                    totalScore += sentimentRes.score;
                    totalComments++;
                    const vote = sentimentRes.vote;
                    if (vote === 'positive') positives++;
                    else if (vote === 'neutral') neutrals++;
                    else if (vote === 'negative') negatives++;

                    if(sentimentRes.score > mostPosScore){
                        mostPosScore = sentimentRes.score;
                        mostPosText = comment.text;
                    }

                    if(sentimentRes.score < mostNegScore){
                        mostNegScore = sentimentRes.score;
                        mostNegText = comment.text;
                    }
                    // commentsBox.insertAdjacentHTML(
                    //     "beforeend",
                    //     `
                    //     <div class="comment-card">
                    //         <p>${comment.text}</p>
                    //         <p>Sentimiento: <strong>${sentimentRes.sentiment}</strong> (Score: ${sentimentRes.score})</p>
                    //     </div>
                    //     `
                    // );
                }

                await sleep(delay);

            } catch (err) {
                console.error(err);
            }
        }
        
        const avg = totalComments > 0 ? (totalScore / totalComments).toFixed(2) : 0;

        analysisBox.innerHTML = `
            <div class="result-card">
                <h5>Promedio de sentimiento:</h5>
                <h2><strong> ${avg}</strong></h2><h7> de ${totalComments} comentarios</h7>
            </div>
        `;

        await sleep(delay);
        
        analysisBox.insertAdjacentHTML(
                    "beforeend",
            `
                <div class="comment-card">
                    <h5>Conteo de comentarios por sentimiento:</h5>
                    <canvas id="sentimentChart" width="400" height="300"></canvas>
                </div>

            `);

        const ctx = document.getElementById('sentimentChart').getContext('2d');

        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Positivos', 'Neutrales', 'Negativos'],
                datasets: [{
                    data: [positives, neutrals, negatives],
                    backgroundColor: [
                        '#4caf50',  // verde
                        '#bdbdbd', // gris
                        '#f44336'  // rojo
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        labels: { color: 'white' }
                    }
                }
            }
        });

        await sleep(delay);
        
        analysisBox.insertAdjacentHTML(
                    "beforeend",
            `
                <div class="result-card">
                    <h5><strong>Comentario más positivo:</strong></h5>
                    <h6>Score: ${mostPosScore}</h6><br/>
                    <p>"${mostPosText}"</p>
                </div>
            `);
            
            
        await sleep(delay);
            
            analysisBox.insertAdjacentHTML(
                        "beforeend",
                `
                    <div class="result-card">
                        <h5><strong>Comentario más negativo:</strong></h5>
                        <h6>Score: ${mostNegScore}</h6><br/>
                        <p>"${mostNegText}"</p>
                    </div>
                `);

    }


    async function analyzeComment(comment) {
        const res = await fetch('/api/sentiment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: comment })
        });
        return await res.json();
    }