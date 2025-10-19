/**
 * Multi-Image Converter with OCR
 * Features:
 * - Full-screen drag & drop
 * - Convert to PNG, JPG, WEBP
 * - Extract Text (OCR) during conversion with better accuracy
 * - Split-screen display: images left, extracted text right
 * - Copy text option
 * - Remove images before conversion
 * - Direct download for single image / ZIP for multiple images
 *
 * Setup:
 *   npm init -y
 *   npm install express multer sharp archiver tesseract.js
 *
 * Run:
 *   node image-converter.js
 */

const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const fs = require("fs/promises");
const path = require("path");
const archiver = require("archiver");
const Tesseract = require("tesseract.js");

const app = express();
const upload = multer({ dest: "uploads/" });
const PORT = 3000;

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Multi-Image Converter</title>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet">

<style>
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:100%;height:100%;font-family:'Poppins',sans-serif;background:#f3f4f6;}
.container{display:flex;flex-direction:column;width:100%;padding:20px;overflow:auto;}
h1{font-size:2rem;color:#2d3436;margin-bottom:20px;text-align:center;}
.drag-drop-box{width:100%;border:3px dashed #a0a0a0;border-radius:16px;background:#fafafa;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:50px;cursor:pointer;transition:0.2s;min-height:300px;margin-bottom:20px;}
.drag-drop-box.dragover{background:#eaf4ff;border-color:#007bff;}
.drag-drop-box span{font-size:1.2rem;color:#555;text-align:center;}
input[type="file"]{display:none;}
.controls{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:15px;align-items:center;}
select,button{padding:12px;border-radius:8px;border:1px solid #ccc;font-size:1rem;}
button{background:linear-gradient(90deg,#007bff,#00c6ff);color:#fff;border:none;cursor:pointer;transition:0.2s;}
button:hover{background:linear-gradient(90deg,#0056b3,#00a1d6);}
.main{display:flex;gap:15px;width:100%;height:calc(100% - 300px);overflow:auto;}
.left-panel,.right-panel{flex:1;overflow:auto;padding:10px;background:#fff;border-radius:12px;box-shadow:0 5px 15px rgba(0,0,0,0.1);}
#filesPreview .file-card{position:relative;border:1px solid #ccc;border-radius:10px;padding:8px;margin-bottom:10px;}
#filesPreview img{max-width:100%;border-radius:8px;}
.remove-btn{position:absolute;top:5px;right:5px;background:#ff5c5c;color:white;border:none;border-radius:50%;width:22px;height:22px;cursor:pointer;font-weight:bold;}
.ocrText{font-size:0.9rem;color:#333;white-space:pre-wrap;margin-bottom:10px;border-bottom:1px dashed #ccc;padding-bottom:5px;position:relative;}
.copy-btn{position:absolute;top:5px;right:5px;background:#007bff;color:white;border:none;padding:2px 8px;border-radius:4px;cursor:pointer;font-size:0.8rem;}
.download-btn{display:inline-block;margin-top:10px;padding:10px 20px;background:#28a745;color:white;border-radius:6px;text-decoration:none;transition:0.3s;}
.download-btn:hover{background:#1e7e34;}
@media (max-width:900px){.main{flex-direction:column;}}

</style>
</head>
<body>
<div class="container">
<h1>Multi-Image Converter</h1>
<div class="ad-banner" style="width:100%; text-align:center; margin-bottom:15px;">
  <script type='text/javascript' src='//pl27877410.effectivegatecpm.com/df/02/50/df0250cd75bd87e7a10a58801911273a.js'></script>
</div>

<label class="drag-drop-box" id="dragDropBox">
  <span id="dragDropText">Click or drag your images here</span>
  <input type="file" id="fileInput" name="files" accept="image/*" multiple>
</label>

<div class="controls">
  <select id="format">
    <option value="png">Convert to PNG</option>
    <option value="jpeg">Convert to JPG</option>
    <option value="webp">Convert to WEBP</option>
    <option value="text-only">Extract Text Only</option>
  </select>
  <button id="convertBtn">Convert & Download</button>
</div>

<div class="main">
  <div class="left-panel" id="filesPreview"></div>
  <div class="right-panel" id="ocrPreview"></div>
</div>

<div id="result"></div>
</div>

<script src="https://cdn.jsdelivr.net/npm/tesseract.js@4.1.3/dist/tesseract.min.js"></script>
<script>
const dragDropBox=document.getElementById("dragDropBox");
const fileInput=document.getElementById("fileInput");
const filesPreview=document.getElementById("filesPreview");
const ocrPreview=document.getElementById("ocrPreview");
const convertBtn=document.getElementById("convertBtn");
const result=document.getElementById("result");
const formatSelect=document.getElementById("format");

let filesArray=[];
let currentTesseractJobs=[];

dragDropBox.addEventListener("dragover", e=>{e.preventDefault(); dragDropBox.classList.add("dragover");});
dragDropBox.addEventListener("dragleave",()=>dragDropBox.classList.remove("dragover"));
dragDropBox.addEventListener("drop", e=>{e.preventDefault(); dragDropBox.classList.remove("dragover"); handleFiles([...e.dataTransfer.files]);});
fileInput.addEventListener("change", e=>handleFiles([...e.target.files]));

function handleFiles(newFiles){
  filesArray=[...filesArray,...newFiles];
  renderFiles();
}

function renderFiles(){
  filesPreview.innerHTML="";
  ocrPreview.innerHTML="";
  filesArray.forEach((file,index)=>{
    const card=document.createElement("div");
    card.className="file-card";
    const img=document.createElement("img");
    img.src=URL.createObjectURL(file);
    const removeBtn=document.createElement("button");
    removeBtn.className="remove-btn";
    removeBtn.textContent="×";
    removeBtn.onclick=()=>{filesArray.splice(index,1); renderFiles();};
    card.appendChild(img);
    card.appendChild(removeBtn);
    filesPreview.appendChild(card);
  });
}

function displayOCRText(texts){
  ocrPreview.innerHTML="";
  texts.forEach((txt,index)=>{
    const div=document.createElement("div");
    div.className="ocrText";
    div.textContent=txt || "No text detected";
    const copyBtn=document.createElement("button");
    copyBtn.className="copy-btn";
    copyBtn.textContent="Copy";
    copyBtn.onclick=()=>{navigator.clipboard.writeText(txt || "");};
    div.appendChild(copyBtn);
    ocrPreview.appendChild(div);
  });
}

convertBtn.addEventListener("click", async ()=>{
  if(!filesArray.length) return alert("Select images first.");
  result.innerHTML="Processing...";
  ocrPreview.innerHTML="";
  currentTesseractJobs=[];

  const format=formatSelect.value;

  if(format==="text-only"){
    const texts=[];
    for(const file of filesArray){
      // Improve OCR accuracy by pre-processing
      const img = await Tesseract.createWorker({
        logger:m=>{}
      });
      await img.load();
      await img.loadLanguage("eng");
      await img.initialize("eng");
      const { data:{ text } } = await img.recognize(file);
      texts.push(text);
      await img.terminate();
    }
    displayOCRText(texts);
    result.textContent="Done";
    return;
  }

  // Normal conversion
  const formData=new FormData();
  filesArray.forEach(f=>formData.append("files",f));
  formData.append("format",format);

  try{
    const endpoint = filesArray.length===1 ? "/convert" : "/convert-zip";
    const res = await fetch(endpoint,{method:"POST",body:formData});
    if(!res.ok) throw new Error("Conversion failed");

    const blob=await res.blob();
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;
    a.download=filesArray.length===1 ? "converted."+format : "converted_images.zip";
    a.className="download-btn";
    a.textContent=filesArray.length===1 ? "Download Image" : "Download ZIP";
    result.innerHTML="";
    result.appendChild(a);
  }catch(err){console.error(err); result.textContent="Conversion failed.";}
});
</script>
</body>
</html>`);
});

// Single image conversion
app.post("/convert", upload.single("files"), async (req,res)=>{
  try{
    const format=req.body.format||"png";
    const inputPath=req.file.path;
    const outputPath=inputPath+"-converted."+format;
    await sharp(inputPath).toFormat(format).toFile(outputPath);
    res.download(outputPath,"converted."+format, async ()=>{
      await fs.unlink(inputPath).catch(()=>{});
      await fs.unlink(outputPath).catch(()=>{});
    });
  }catch(err){console.error(err); res.status(500).send("Conversion failed");}
});

// Multiple images -> ZIP
app.post("/convert-zip", upload.array("files"), async (req,res)=>{
  if(!req.files || !req.files.length) return res.status(400).send("No files uploaded");
  const format=req.body.format||"png";

  res.setHeader("Content-Type","application/zip");
  res.setHeader("Content-Disposition","attachment; filename=converted_images.zip");
  const archive=archiver("zip",{zlib:{level:9}});
  archive.on('error', err => { console.error(err); res.status(500).send("Archive failed"); });
  archive.pipe(res);

  try{
    const convertedFiles=[];
    for(const file of req.files){
      const outPath=file.path+"-converted."+format;
      await sharp(file.path).toFormat(format).toFile(outPath);
      convertedFiles.push({ path: outPath, name: file.originalname.replace(/\.[^/.]+$/,"")+"."+format });
      await fs.unlink(file.path).catch(()=>{});
    }
    convertedFiles.forEach(f=>archive.file(f.path,{name:f.name}));
    archive.finalize();
    archive.on('end', async ()=>{for(const f of convertedFiles) await fs.unlink(f.path).catch(()=>{});});
  }catch(err){console.error(err); res.status(500).send("Conversion failed");}
});

app.listen(PORT, ()=>console.log(`✅ Multi-Image Converter running at http://localhost:${PORT}`));
