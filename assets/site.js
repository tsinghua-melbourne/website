document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  var nav = document.querySelector('.nav');

  // Adaptive nav: transparent on top (embedded in hero), frosted glass after scroll
  if (nav) {
    var onScroll = function () {
      if (window.scrollY > 40) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  if (toggle && links) {
    toggle.addEventListener('click', function () {
      links.classList.toggle('open');
      var inner = document.querySelector('.nav-inner');
      if (inner) inner.classList.toggle('open', links.classList.contains('open'));
    });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        links.classList.remove('open');
      });
    });
  }

  // Post page "back to news" goes to the news page containing this post's card
  // (href is generated per-post; nothing to intercept)

  // Adaptive news pagination: cards-per-page depends on viewport width
  var postList = document.getElementById('post-list');
  if (postList) {
    var cards = Array.prototype.slice.call(postList.children);
    var pagerNums = document.getElementById('pager-nums');
    var state = { perPage: 9, page: 0 };

    function perPageForWidth(w) {
      if (w < 640) return 6;
      if (w < 1024) return 9;
      if (w < 1440) return 12;
      return 15;
    }

    function render() {
      var start = state.page * state.perPage;
      cards.forEach(function (card, i) {
        card.style.display = (i >= start && i < start + state.perPage) ? '' : 'none';
      });
      var total = Math.ceil(cards.length / state.perPage);
      var html = '';
      for (var j = 0; j < total; j++) {
        var cls = j === state.page ? 'pager-num active' : 'pager-num';
        html += '<a class="' + cls + '" href="#" data-page="' + j + '">' + (j + 1) + '</a>';
      }
      pagerNums.innerHTML = html;
    }

    pagerNums.addEventListener('click', function (e) {
      var el = e.target.closest('a[data-page]');
      if (el) {
        e.preventDefault();
        state.page = parseInt(el.getAttribute('data-page'), 10);
        render();
        var top = postList.getBoundingClientRect().top + window.pageYOffset - 140;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    });

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        var newPerPage = perPageForWidth(window.innerWidth);
        if (newPerPage !== state.perPage) {
          // keep first visible card on the new page when possible
          var firstVisible = state.page * state.perPage;
          state.perPage = newPerPage;
          state.page = Math.floor(firstVisible / newPerPage);
          render();
        }
      }, 150);
    });

    state.perPage = perPageForWidth(window.innerWidth);
    render();
  }

  // Scroll reveal
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('visible'); });
  }
});
