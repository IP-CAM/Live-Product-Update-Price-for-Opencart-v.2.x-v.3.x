'use strict';

var g_product_id = String('{$product_id}');

var g_duration = Number('{$this->misc["fade"]}');
var g_log = Boolean(Number('{$this->misc["log"]}'));
var g_qt_buttons = Boolean(Number('{$this->misc["qt_btn"]}'));
var g_product_tot = Boolean(Number('{$this->common["product_tot"]}'));

var g_content_id = '#{$this->id["content_id"]}';

var g_price_id = g_content_id + ' ' + '#{$this->id["price_id"]}';
var g_special_id = g_content_id + ' ' + '#{$this->id["special_id"]}';
var g_discount_id = g_content_id + ' ' + '#{$this->id["discount_id"]}';
var g_tax_id = g_content_id + ' ' + '#{$this->id["tax_id"]}';
var g_points_id = g_content_id + ' ' + '#{$this->id["points_id"]}';
var g_reward_id = g_content_id + ' ' + '#{$this->id["reward_id"]}';
var g_option_id = g_content_id + ' ' + '#{$this->id["option_id"]}';

var tag_qt;
var qt;
var refreshQty;

if (g_log) {
    console.log('-- Live Product > Start...');
}

if ($(g_content_id + ' input[name="quantity"]').length) {
    tag_qt = 'input[name="quantity"]';
    qt = $(tag_qt).val();

    if (g_qt_buttons) {
        let prev_qt = Number($(tag_qt).val()) || 1;
        let next_qt;

        refreshQty = setInterval(function () {
            next_qt = Number($(tag_qt).val()) || 1;

            if (isNaN(prev_qt) || isNaN(next_qt)) {
                clearInterval(refreshQty);
            } else {
                if (prev_qt != next_qt) {
                    update();
                }

                prev_qt = next_qt;
            }
        }, 100);
    } else {
        $(document).off('input paste change', tag_qt).on('input paste change', tag_qt, function (ev) {
            update();
        });
    }
} else if ($(g_content_id + ' select[name="quantity"]').length) {
    tag_qt = 'select[name="quantity"]';
    qt = $(tag_qt + ' option:selected').val();

    $(document).off('change', tag_qt).on('change', tag_qt, function (ev) {
        update();
    });
} else if ($(g_content_id + ' [name="quantity"]').length) {
    tag_qt = '[name="quantity"]';
    qt = $(tag_qt).val();

    $(document).off('input paste change', tag_qt).on('input paste change', tag_qt, function (ev) {
        update();
    });
} else {
    qt = 1;
}

var tags_options = [
    '[id^="input-option"] input[type="checkbox"]',
    '[id^="input-option"] input[type="radio"]',
    'select[id^="input-option"]',
];

$(document).off('change', tags_options.join(',')).on('change', tags_options.join(','), function (ev) {
    update();
});

$(document).ready(function () {
    // Force update product price after page onload
    if (qt) {
        update();
    }
});

function update() {
    var url = 'index.php?route=extension/module/live_product&id=' + g_product_id;
    var tags_post_data = [
        g_content_id + ' [id^="input-option"] input[type="checkbox"]:checked',
        g_content_id + ' [id^="input-option"] input[type="radio"]:checked',
        g_content_id + ' select[id^="input-option"]',
        g_content_id + ' input[type="hidden"]',
        g_content_id + ' input[type="number"]',
        g_content_id + ' input[type="text"]',
        g_content_id + ' [name="quantity"]',
    ];

    var data = $(tags_post_data.join(','));

    $.ajax({
        type: 'POST',
        url: url,
        data: data,
        dataType: 'json',
        beforeSend: function () { },
        complete: function () { tags_post_data = null; },
        success: function (json) {
            if (json.success) {
                showSummary(json);
                showOptions(json);

                if (g_log) {
                    console.log('-- Live Product > ajax response:');
                    console.dir(json);
                }
            } else {
                if (g_log) {
                    console.log('-- Live Product > something wrong:');
                    console.dir(json);
                }
            }
        },
        error: function (error) {
            console.log('-- Live Product > ajax error:');
            console.dir(error);
        }
    });
};


// Update summary info on product page
function showSummary(json) {
    showEl(g_price_id, json.product.price);

    if (json.product.special) {
        showEl(g_special_id, json.product.special);
    }

    if (json.product.extax) {
        showEl(g_tax_id, json.product.extax);
    }

    if (json.product.reward) {
        showEl(g_reward_id, json.product.reward);
    }

    if (json.product.points) {
        showEl(g_points_id, json.product.points);
    }

    if (json.product.discounts) {
        for (let qt in json.product.discounts) {
            showEl(g_discount_id + '-' + qt, json.product.discounts[qt]);
        }

        if (json.product.d_qt) {
            $(g_content_id + ' [id^="' + '{$this->id["discount_id"]}' + '-"]')
                .css('font-weight', 'normal')
                .css('color', 'inherit');
            $(g_discount_id + '-' + json.product.d_qt)
                .css('font-weight', 'bold')
                .css('color', 'red');
        } else {
            $(g_content_id + ' [id^="' + '{$this->id["discount_id"]}' + ' - "]')
                .css('font-weight', 'normal')
                .css('color', 'inherit');
        }
    }
}

// Show available options on product page
function showOptions(json) {
    if (json.product.options) {
        // IE11 fix: json.product.options.forEach(option => {
        [].forEach.call(json.product.options, function (option) {
            if (option.type == 'checkbox' || option.type == 'radio' || option.type == 'select') {
                let option_id = option.product_option_id;
                let option_type = option.type;

                // IE11 fix: option.product_option_value.forEach(option_value => {
                [].forEach.call(option.product_option_value, function (option_value) {
                    let id = g_option_id + '-' + option_id + '-' + option_value.product_option_value_id;
                    let text = '';

                    // text = option_value._price ? '(' + option_value._price + ')' : text;
                    text = option_value.price ? '(' + option_value.price + ')' : text;
                    text = (option_type == 'select') ? [option_value.name, text].join(' ') : text;

                    showEl(id, text);
                });
            }
        });
    }
}

function showEl(el, content) {
    if (content && $(el).length) {
        if (content != $(el).html()) {
            $(el).fadeOut(0, function () {
                $(this)
                    .html(content)
                    .fadeIn(g_duration);
            });
        }
    } else {
        $(el).fadeOut(g_duration, function () {
            $(this).empty();
        });
    }
}

function htmlDecode(value) {
    return $("<textarea/>")
        .html(value)
        .text();
}
