
// $ to use jQuery in no conflict mode to prevent conflict with jquery version 1.7
var $ = jQuery.noConflict();


var dataList = [];
var disabledCountriesList = [];
$(async () => {

    // Get the data from the CSV file
    await Convert_CSV_to_JSON();

    var currentlang = await $('html').attr('lang').indexOf('ar') > -1 ? 'ar' : 'en';

    if (currentlang == 'ar') {
        // change the page direction to RTL
        $('html').attr('dir', 'rtl');
    }

    mapName = "continents_mill" + (currentlang == 'ar' ? '_ar' : '_en');

    $('.widget-title.show-by').html(currentlang == 'en' ? 'Show by' : 'عرض حسب');

    $('.widget-title.filter-by-continent').html(currentlang == 'en' ? 'Filter by Continent' : 'تصفية حسب القارة');

    $('.content-filter .all_continents label ').html(currentlang == 'en' ? 'All Continents' : 'جميع القارات');
    $('.content-filter .all_countries label ').html(currentlang == 'en' ? 'All Countries' : 'جميع الدول');
    $('.content-filter .uae label ').html(currentlang == 'en' ? 'United Arab Emirates' : 'الإمارات العربية المتحدة');
    $('.filter-list .all label ').html(currentlang == 'en' ? 'All' : 'الكل');


    // Create the map based on the map name
    Create_the_Map(mapName, '', '');

});
//==============================================
// Change the map when a region is clicked
//==============================================
const continentsChange = async (regionCode) => {
    var currentlang = await $('html').attr('lang').indexOf('ar') > -1 ? 'ar' : 'en';
    if (regionCode == 'NA' || regionCode == 'SWA' || regionCode == 'AFR' || regionCode == 'OC' || regionCode == 'AS' || regionCode == 'EU') {
        await $('#world-map').vectorMap('get', 'mapObject').clearSelectedRegions();
        await $('#world-map').empty();
        await $('.jvectormap-tip').remove();
        changeMapByRegion(regionCode);
        var tableData = dataList.filter((item) => {
            return item.continentCode == regionCode;
        });
        createTableList(tableData, regionCode, '');
        regionCode = '';
    }
}


//======================================
// When Fillter by Clicking on Map
//======================================
$(document).on("click", ".jvectormap-region", async function () {
    var regionCode = $(this).attr("data-code");
    continentsChange(regionCode);
});

//======================================
// When Fillter by Clicking on Tabs 
//======================================
$('.filter-tabs .nav-link').on("click", async function () {
    // Get the Tag ID, and set the map to the correct language based on the Tag ID
    var regionCode = await $(this).attr("id");

    // remove the active class from all tabs
    $('.filter-tabs .nav-link').removeClass('active');
    //e.preventDefault()
    // Add the active class to the selected tab
    $(this).addClass('active');

    // Remove the selected country from the map
    await $('#world-map').vectorMap('get', 'mapObject').clearSelectedRegions();
    // Remove the map from the page
    await $('#world-map').empty();
    // Remove the laged tooltip from the map
    await $('.jvectormap-tip').remove();
    // Check the language of the page
    changeMapByRegion(regionCode);

    regionCode = '';

});

$('.content-filter input').on("change", async function () {
    // Get the Tag ID, and set the map to the correct language based on the Tag ID
    var regionCode = await $(this).val();

    if (regionCode != 'All_Continents') {
        $('.continents-list-widget').addClass('d-none');
    } else {
        $('.continents-list-widget').removeClass('d-none');
    }

    // Remove the selected country from the map
    await $('#world-map').vectorMap('get', 'mapObject').clearSelectedRegions();
    // Remove the map from the page
    await $('#world-map').empty();
    // Remove the laged tooltip from the map
    await $('.jvectormap-tip').remove();
    // Check the language of the page
    changeMapByRegion(regionCode);

    regionCode = '';

});

//======================================================================================================
// Function to Create the Map based on the Name of the map
//======================================================================================================
const Create_the_Map = async (mapName, continentCode = '', countryCode = '') => {
    $('.loading-container').addClass('active');
    // Remove the map from the page
    await $('#world-map').empty();
    // Remove the laged tooltip from the map
    await $('.jvectormap-tip').remove();

    //=============================
    // Initialize the map 
    //=============================
    initVectoreMap(mapName, countryCode);

    var currentlang = await $('html').attr('lang').indexOf('ar') > -1 ? 'ar' : 'en';
    // Check if the map is not the continents map
    if (mapName !== 'continents_mill_en' && mapName !== 'continents_mill_ar') {

        var map = $('#world-map').vectorMap('get', 'mapObject');

        // Get the list of disabled countries
        var mapRegions = Object.keys(map.regions).filter((item) => item !== countryCode);

        disabledCountriesList = countryCode == '' ? await setDisabledCountries() : mapRegions;
        // Get the map object and the name of the country clicked on the map
        disabledCountriesList.forEach((item) => {
            map.regions[item].element.disabled = true;
            $('path[data-code="' + item + '"]').css('fill', '#ccc');
            // prevent click on disabled countries
            $('path[data-code="' + item + '"]').css('pointer-events', 'none');
        });

        if (countryCode !== '') {
            // fill the country with the correct color
            map.clearSelectedRegions();
            map.setSelectedRegions(countryCode);
            // Zoom in on the selected country
            map.setFocus({
                region: countryCode
            });
        }

        var newList = []

        if (continentCode !== '') {
            newList = countryCode == '' ? dataList.filter((item) => item.continentCode == continentCode) : dataList.filter((item) => item.code == countryCode);
        } else {
            newList = countryCode == '' ? dataList : dataList.filter((item) => {
                return item.code == countryCode;
            });
        }
        createTableList(newList, continentCode ? continentCode : '', countryCode);

    } else {
        var newList = countryCode == '' ? dataList : dataList.filter((item) => {
            return item.code == countryCode;
        });

        createTableList(newList, '', continentCode);

    }

    setTimeout(() => $('.loading-container').removeClass('active'), 500);

}


//======================================================================================================
// Function to Initialize the map
//======================================================================================================
const initVectoreMap = async (mapName, countryCode = '') => {
    await $('#world-map').vectorMap({
        map: mapName,
        backgroundColor: '#efefef',
        zoomOnScroll: false,
        scale: 1,
        normalizeFunction: 'linear',
        // selectedRegions: ['AE'],
        regionStyle: {
            initial: {
                fill: '#b68a35',
                "fill-opacity": 1,
                stroke: 'none',
                "stroke-width": 0,
                "stroke-opacity": 1
            },
            hover: {
                "fill-opacity": 0.8,
                cursor: 'pointer'
            },
            selected: {
                fill: '#27ae60'
            },
        },
        onRegionClick: function (e, code) {
            var currentlang = $('html').attr('lang').indexOf('ar') > -1 ? 'ar' : 'en';
            // Get the map object and the name of the country clicked on the map
            var map = $('#world-map').vectorMap('get', 'mapObject');

            // remove any selected , then set the selected country to the map
            map.clearSelectedRegions();

            if (countryCode !== '') {
                map.setSelectedRegions(countryCode);
            } else {
                map.setSelectedRegions(code);
            }

            // Filter the data based on the selected country
            let newList = dataList;
            newList = dataList.filter((item) => item.code == code);

            if (newList.length > 0) {
                // scroll to table-container
                $('html, body').animate({
                    scrollTop: $(".table-container").offset().top - 250
                }, 500);
            }
            if (newList.length == 0) {
                return
            }
            // Create the table based on the selected country
            createTableList(newList, '', code);

        },
    });
}

//======================================================================================================
// Function to change the map based on the clicked region
//======================================================================================================
const changeMapByRegion = async (code) => {
    let lang = await $('html').attr('lang').indexOf('ar') > -1 ? '_ar' : '_en';
    switch (code) {
        case 'NA':
            console.log('NA North America');
            Create_the_Map('north_america_mill' + lang, 'NA');
            break;
        case 'SWA':
            Create_the_Map('south_america_mill' + lang, 'SWA');
            console.log('SWA South America');
            break;
        case 'AFR':
            Create_the_Map('africa_mill' + lang, 'AFR');
            console.log('AF Africa');
            break;
        case 'OC':
            Create_the_Map('oceania_mill' + lang, 'OC');
            console.log('OC Oceania');
            break;
        case 'AS':
            Create_the_Map('asia_mill' + lang, 'AS');
            console.log('AS Asia');
            break;
        case 'EU':
            Create_the_Map('europe_mill' + lang, 'EU');
            console.log('EU Europe');
            break;
        case 'All_Continents':
            Create_the_Map('continents_mill' + lang);
            console.log('All_Continents');
            break;
        case 'All_World':
            Create_the_Map('world_mill' + lang);
            console.log('All_World');
            break;
        case 'AE':
            await Create_the_Map('asia_mill' + lang, 'AS', 'AE');
            break;
        default:
            Create_the_Map('world_mill' + lang);
            console.log('default');
            break;
    }
}

//======================================================================================================
// Function to get the list of disabled countries
//======================================================================================================
const Convert_CSV_to_JSON = async () => {
    // csv to json file convert 
    // await $.get('./../../assets/csv/agreements.csv', function (data) {
    await $.get('./../../assets/csv/all.csv', function (data) {
        // await $.get('/En/AboutTheMinistry/Documents/partnership/agreements.csv', function (data) {
        // Parse the CSV data using PapaParse library
        var parsedData = Papa.parse(data).data;
        // Convert the parsed CSV data to JSON format
        var jsonData = [],
            headers = parsedData[0],
            continents = [];
        for (var i = 1; i < parsedData.length; i++) {
            var obj = {};
            for (var j = 0; j < headers.length; j++) {
                obj[headers[j]] = parsedData[i][j];
            }
            jsonData.push(obj);
        }

        dataList = [...jsonData]

        // Get All Continents From JSON Data
        continents = [...new Set(jsonData.map(item => item.continentCode))];
        // remove undefined
        continents = continents.filter((item) => item !== undefined);
        // return it as {code , name}
        continents = continents.map((item) => {
            return {
                code: item,
                name: getContinentsNameByCode(item)
            }
        });
        // order the continents alphabetically
        continents.sort()

        // append them to list of continents as a radio button
        continents.forEach(({ code, name }) => {
            $('.filter-list').append(`
            <li class="list-item">
                <input class="mx-1" type="radio" id="${code}" name="continents" value="${code}" onchange="continentsChange('${code}')">
                <label class="mx-1" for="${code}">${name}</label>
            </li>
            `);
        });
        return jsonData;
    });
}

//======================================================================================================
// Function to get Continents Name By Code
//======================================================================================================
const getContinentsNameByCode = (code) => {
    var currentlang = $('html').attr('lang');
    switch (code) {
        case 'NA':
            return currentlang.indexOf('ar') > -1 ? 'أمريكا الشمالية' : 'North America';
        case 'SWA':
            return currentlang.indexOf('ar') > -1 ? 'أمريكا الجنوبية' : 'South America';
        case 'AFR':
            return currentlang.indexOf('ar') > -1 ? 'أفريقيا' : 'Africa';
        case 'OC':
            return currentlang.indexOf('ar') > -1 ? 'أوقيانوسيا' : 'Oceania';
        case 'AS':
            return currentlang.indexOf('ar') > -1 ? 'آسيا' : 'Asia';
        case 'EU':
            return currentlang.indexOf('ar') > -1 ? 'أوروبا' : 'Europe';
        case 'All_Continents':
            return currentlang.indexOf('ar') > -1 ? 'جميع القارات' : 'All Continents';
        case 'All_World':
            return currentlang.indexOf('ar') > -1 ? 'العالم' : 'World';
        default:
            return currentlang.indexOf('ar') > -1 ? 'جميع القارات' : 'All Continents';
    }
}

//======================================================================================================
// Function to Create the Table List from the JSON Data Parameter
//======================================================================================================
const createTableList = async (list, continentCode = '', contryCode = '') => {
    $('.table tbody').empty();
    // Set the count of the list
    $('.data-header .count').html(`(${list.length})`);
    var tableHeaderTitle = $('.data-header .table-title');
    // Check the language and change the table header based on it
    var currentlang = await $('html').attr('lang').indexOf('ar') > -1 ? 'ar' : 'en';

    // Check the language and change the table header based on it
    $('.table th.country').html(currentlang == 'en' ? 'Country' : 'الدولة');
    $('.table th.continent').html(currentlang == 'en' ? 'Continent' : 'القارة');
    $('.table th.entinty').html(currentlang == 'en' ? 'Entity' : 'الجهة');
    $('.table th.agreement').html(currentlang == 'en' ? 'Agreement' : 'الاتفاقية');
    $('.table th.goals').html(currentlang == 'en' ? 'Goals' : 'الأهداف');


    if (!continentCode && !contryCode) {
        tableHeaderTitle.html(currentlang == 'en' ? 'International Agreements - World' : 'الاتفاقيات الدولية - العالم');
    } else if (continentCode == 'AS' && contryCode == 'AE') {
        tableHeaderTitle.html(currentlang == 'en' ? 'Local Agreements - United Arab Emirates' : 'الاتفاقيات المحلية - الإمارات العربية المتحدة');
    } else if (continentCode && contryCode == '') {
        tableHeaderTitle.html(currentlang == 'en' ? 'International Agreements - ' + getContinentsNameByCode(continentCode) : 'الاتفاقيات الدولية - ' + getContinentsNameByCode(continentCode));
    } else if (contryCode && continentCode == '') {
        tableHeaderTitle.html(currentlang == 'en' ? 'International Agreements - ' + list[0].country : 'الاتفاقيات الدولية - ' + list[0].countryAr);
    } else {
        tableHeaderTitle.html(currentlang == 'en' ? '00International Agreements - ' + list[0].country : 'الاتفاقيات الدولية - ' + list[0].countryAr);
    }


    // Create the table list
    iniatDatatable(list, currentlang);



}

//======================================================================================================
// Function to Set the Disabled Countries
//======================================================================================================
const setDisabledCountries = async () => {
    // get the map regions
    var mapRegions = await $('#world-map').vectorMap('get', 'mapObject').regions;

    // get the codes that not exist in dataList.code
    var disabledCountries = [];

    for (var key in mapRegions) {
        if (mapRegions.hasOwnProperty(key)) {
            if (!dataList.some((item) => {
                return item.code == key;
            })) {
                disabledCountries.push(key);
            }
        }
    }

    return disabledCountries;
}


const iniatDatatable = (data, lang) => {
    // iniatDatatable(currentlang);
    if ($.fn.DataTable.isDataTable('#DataTable')) {
        $('#DataTable').DataTable().destroy();
    }
    // data table with based on list array and language attribute
    $('#DataTable').DataTable({
        "info": false,
        "data": data,
        "columns": [{
            "data": "country",
            "render": function (data, type, row, meta) {
                return meta.row + 1;
            }
        },
        {
            "data": "country",
            "render": function (data, type, row, meta) {
                return lang == 'en' ? row.country : row.countryAr;
            }
        },
        {
            "data": "continent",
            "render": function (data, type, row, meta) {
                return lang == 'en' ? row.continent : row.continentAr;
            }
        },
        {
            "data": "entity",
            "render": function (data, type, row, meta) {
                return row.entity ? (lang == 'en' ? row.entity : row.entityAr) : '-'
            }
        },
        {
            "data": "agreements",
            "render": function (data, type, row, meta) {
                return lang == 'en' ? row.agreements : row.agreementsAr;
            }
        },
        {
            "data": "goals",
            "render": function (data, type, row, meta) {
                return lang == 'en' ? row.goals : row.goalsAr;
            }
        }
        ],
        "language": {
            "noResults": `${lang == 'en' ? 'No Data Available' : 'لا توجد بيانات متاحة'}`,
            "info": `${lang == 'en' ? 'Showing _START_ to _END_ of _TOTAL_ entries' : 'عرض _START_ إلى _END_ من _TOTAL_ إدخالات'}`,
            "infoEmpty": `${lang == 'en' ? 'Showing 0 to 0 of 0 entries' : 'عرض 0 إلى 0 من 0 إدخالات'}`,
            "infoFiltered": `${lang == 'en' ? '(filtered from _MAX_ total entries)' : '(تمت تصفيتها من مجموع _MAX_ إدخالات)'}`,
            "lengthMenu": `${lang == 'en' ? 'Show _MENU_ entries' : 'عرض _MENU_ إدخالات'}`,
            "search": `${lang == 'en' ? 'Search:' : 'بحث:'}`,
            "paginate": {
                "first": `${lang == 'en' ? 'First' : 'الأول'}`,
                "last": `${lang == 'en' ? 'Last' : 'الأخير'}`,
                "next": `${lang == 'en' ? 'Next' : 'التالى'}`,
                "previous": `${lang == 'en' ? 'Previous' : 'السابق'}`,
            }
        },
        "order": [
            [0, "asc"]
        ],
        "pageLength": 10,
        "lengthMenu": data.length > 10 ?
            [
                [10, 25, 50, 100, -1],
                [10, 25, 50, 100, "All"]
            ] : [10],
        "dom": '<"top"i>rt<"bottom d-flex justify-content-between"lp><"clear">',
        "initComplete": '',
    });


}