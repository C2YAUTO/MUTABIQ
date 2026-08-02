globalThis.fetch = async () => ({ ok:false })
const mod = await import('./certificate-pdf.js')
const cert = {
  id:1, slug:'test', ccrNumber:'511349', status:'Valid', certificateType:'Motor Vehicles',
  manufacturer:'Maruti Suzuki India Ltd', brand:'Suzuki', manufacturerAddress:'1,Nelson Mandela Road, New Delhi',
  applicant:'GSO', vehicleType:'SUZUKI JIMNY - 5 DOOR', model:'Jimny', modelYear:'2025',
  vehicleCategory:'Multipurpose Vehicle', countryOfOrigin:'India', countryOfProduction:'India',
  manufacturerRef:'Euro4', producedAfter:'Month 6 Year 2025', engineNumber:'', color:'Silver',
  techRegulations:'', maxVehicleWeight:'1545kg', curbWeight:'1215kg', maxAxleFront:'765', maxAxleRear:'880',
  lengthMm:'3820', widthMm:'1645', heightMm:'1725', wheelbaseMm:'2590', trackFront:'1395', trackRear:'1405',
  chassisBodyType:'Sedan', numPassengers:'5', fuelType:'Gasoline', numberOfCylinders:'4', engineCapacity:'1462cc',
  airIntake:'Regular', netEnginePower:'75', engineRpm:'6000', pollutantLimit:'Euro4', transmission:'4AT',
  ecallSystem:'Provided', serviceBrakes:'Hydraulic', emergencyBrakes:'Combined', fuelVehicleClass:'Passenger Car',
  feCafeCombined:'17.8', feRating:'Excellent', issueDate:'2025-01-01', expiryDate:'2026-01-01', notes:'',
  exporterName:'JAWHARAT AL BAKHEET FZCO', exporterAddress:'UAE', consigneeName:'CHEFAFRA SALHA', consigneeAddress:'Tunisia',
  destinationCountry:'Tunisia', meansOfTransport:'By Sea', portOfDischarge:'', departureDate:'', invoiceNumber:'2026PIOO1207-06',
  invoiceDate:'11/06/2026', originCertNumber:'4579407', originCertDate:'11-JUN-2026', priceUsd:'24,500.00', priceWords:'Twenty-four thousand five hundred dollars',
  numDoors:'5', numSeats:'5', vin:'MA3JJC74WS0188757', createdAt:new Date(), updatedAt:new Date(),
}
try {
  const blob = await mod.generateCertificatePdf(cert, 'data:image/png;base64,iVBORw0KGgo=', 'https://x/certificate/test', 'dossier-test', 'preview')
  console.log('RESULT blob size:', blob && blob.size, 'SUCCESS')
} catch(e) {
  console.log('THROWN:', (e && e.stack) || e)
}
