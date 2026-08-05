function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'getConfig') {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      data: getConfig()
    }))
    .setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput("System Active. Use POST to interact.");
}

function doPost(e) {
  let result = { status: "error", message: "Invalid request" };
  
  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;
    
    if (action === 'saveConfig') {
      saveConfig(postData.data);
      result = { status: "success", message: "Config saved successfully." };
    } 
    else if (action === 'newOrder') {
      const order = postData.data;
      saveOrder(order);
      sendTelegramNotification(order);
      result = { status: "success", message: "Order processed successfully." };
    }
  } catch (error) {
    result.message = error.toString();
  }
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}