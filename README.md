[Skip to content](https://github.com/freicoin/freicoin/wiki/How-to-implement-a-Freicoin-exchange#start-of-content)
Search or jump to…
MENU

Dashboard
Banking
Sales
Customers & leads
Cash flow
Expenses
Payroll
Time
Reports
Taxes
Mileage
Accounting
My accountant
Capital
Commerce
Apps
Insurance
Live Bookkeeping

More (0)
BOOKMARKS

Banking
Live Bookkeeping

Menu settings
No company name
My Experts

LOGO
No company name
Get things done
Business overview

PRIVACY
PROFIT AND LOSS
Last 30 days
$0
Net income for last 30 days
0 transactions
$0
Income
$0
Expenses
Bring in transactions automatically
EXPENSES
Last 30 days
$0.00
Total expenses
$0.00
INVOICES
We paused loading this content to help other items on this page go faster.
Click here to see the info
BANK ACCOUNTS
We paused loading this content to help other items on this page go faster.
Click here to see the info
SALES
We paused loading this content to help other items on this page go faster.
Click here to see the info
DISCOVER MORE
video thumbnail
Connect confidently
Securely link all of your business banking and credit cards in QuickBooks.
Link your accounts
See all activity
legal_copyright_notice
PrivacySecurityTerms of Service
ZACHRYTWOOD ZACHRYTYLERWOODADMINISTRATOR
cr12753750.00bitore341731337@gmail.com
Manage your Intuit Account
[Pull requests](https://github.com/pulls)
[Issues](https://github.com/issues)
[Codespaces](https://github.com/codespaces)
[Marketplace](https://github.com/marketplace)
[Explore](https://github.com/explore)
 BEGIN:
GLOW4:
</git checkout origin/main
+Run'' 'Runs::/Action::/:Build::/scripts::/Run-on :Runs :
+Runs :gh/pages :
+pages :edit "
+$ intuit install
+PURL" --add-label "production"
+env:
+PR_URL: ${{github.event.pull_request.html_url}}
+GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
+run: gh pr edit "$PR_URL" --add-label "production"
+env:
+PR_URL: ${{github.event.pull_request.html_url}}
'-''  '::NOTE:: "+GITHUB_TOKEN':'' '{'{'{'{'$'' '{'['('('(C)'.'(R)')'.'[12753750'.'[00']m'}'_'{BITORE'_34173'.1337}'_18331''' ')']'}'}'}'"'' :  :NOTE:: 
</git checkout origin/main
author:ZACHRY_T_WOOD_EIN_88-13403491 :# `run-name` for workflow runs to dynamically set the name of the workflow run.
versions:
  fpt: '*'
  ghec: '*'
  ghes: '>=3.8'
  ghae: '>=3.8'@mowjoejoejoejoe 
Your account has been flagged.
Because of that, your profile is hidden from the public. If you believe this is a mistake, [contact support](https://github.com/contact) to have your account status reviewed.
How to implement a Freicoin exchange
Jorge Timón edited this page on Feb 3, 2014 · [1 revision](https://github.com/freicoin/freicoin/wiki/How-to-implement-a-Freicoin-exchange/_history)
 Pages 4
Find a page…
[Home](https://github.com/freicoin/freicoin/wiki)
[Freicoin colored coins](https://github.com/freicoin/freicoin/wiki/Freicoin-colored-coins)
[How to implement a Freicoin exchange](https://github.com/freicoin/freicoin/wiki/How-to-implement-a-Freicoin-exchange)
[How to properly handle demurrage in applications](https://github.com/freicoin/freicoin/wiki/How-to-properly-handle-demurrage-in-applications)
[ Add a custom sidebar](https://github.com/freicoin/freicoin/wiki/_new?wiki%5Bname%5D=_Sidebar)
Clone this wiki locally
https://github.com/freicoin/freicoin.wiki.git
It is possible to implement a Freicoin exchange which results in stable trading with minimal overhead. I will assume that the exchange uses the [demurrage-adjusted running balance](https://github.com/freicoin/freicoin/wiki/How-to-properly-handle-demurrage-in-applications) approach to demurrage accounting, as this results in less complicated code and the smallest overhead, and exchanges need not do their accounting in the blockchain directly anyway.

The essence of the exchange is a collection of bid and a collection of ask orders (the orderbook), which are then matched into a sequential series of order fulfillment transactions, which themselves actually move balances around. Let's take each step in turn:

A bid/ask order is an open request by the user to trade XXX number of freicoins for YYY number of bitcoins, dollars, euros, beerbucks, or whatever. In our example Alice wants to trade 1,000frc for 0.5btc, and Bob has an open order giving bitcoins for freicoins at that price, although at the time they entered their bid/ask orders neither one cared when precisely it would occur. This is what the internal state of the exchange looks like:

Alice: <1,500frc, #19500>
       <   10btc>
Bob:   <  100frc, #20000>
       <   50btc>

Bids:  [<5,000frc, 2.5btc, Bob>]
Asks:  [<0.5btc, 1,000frc, Alice>]

Log:   []
This is the simplest model, but it should be obvious how it can be extended to support orders with expiry times, fill-or-kill status or other conditions.

The exchange continuously matches bids to asks, generating fulfillment transactions at the current block height. In this case the exchange creates a multi-chain transaction sending 1,000frc from Alice to Bob with a reference height equal to the current block height, and transferring 0.5btc back from Bob to Alice. Here's the state of the exchange after the fulfillment transaction is created:

Alice: <1,500frc, #19500>
       <   10btc>
Bob:   <  100frc, #20000>
       <   50btc>

Bids:  [<4,000frc, 2btc, Bob>]
Asks:  []

Log:   [<1,000frc Alice -> Bob, 0.5btc Bob -> Alice, #21000>]
An accounting process then replays the fulfillment transaction log, with each order fulfillment setting the reference height for the affected balances to the block height the transaction was fulfilled at (applying demurrage as described [here](https://github.com/freicoin/freicoin/wiki/How-to-properly-handle-demurrage-in-applications)):

Alice: <1,497.85576581frc, #21000>
       <   10btc>
Bob:   <   99.90467798frc, #21000>
       <   50btc>

Bids:  [<4,000frc, 2btc, Bob>]
Asks:  []

Log:   [...]
It then applies the recorded balance transfer (this and the demurrage adjustment should really be an atomic operation, otherwise the log is in an indeterminate state):

Alice: <  497.85576581frc, #21000>
       <   10.5btc>
Bob:   <1,099.90467798frc, #21000>
       <   49.5btc>

Bids:  [<4,000frc, 2btc, Bob>]
Asks:  []

Log:   []
Although it has been illustrative to consider these three steps as distinct from each other and occurring in parallel, the simplest application combines them all into a single sequential program which scans the orderbook and executes trades at the current block height. But I'll leave the implementation details as an exercise for the interested reader.

The only other notes worth making are that 1) since account balances decay, it's possible for naked bid/ask orders to exist at the time of fulfillment; make sure you check for this, and 2) the user-interface needs to perform demurrage calculations to show available balances based on the current block height rather than the reference-height of the latest fulfillment, which is what the database stores. Ideally this is done client-side in JavaScript (similar to the many web applications turn dates into localized text like "five minutes ago"), but it could be done server-side as well at the cost of making the user refresh to check their available balance.

[ Add a custom footer](https://github.com/freicoin/freicoin/wiki/_new?wiki%5Bname%5D=_Footer)
Footer
© 2023 GitHub, Inc.
Footer navigation
[Terms](https://docs.github.com/en/github/site-policy/github-terms-of-service)
[Privacy](https://docs.github.com/site-policy/privacy-policies/github-privacy-statement)
[Security](https://github.com/security)
[Status](https://www.githubstatus.com/)
[Docs](https://docs.github.com/)
[Contact GitHub](https://support.github.com/?tags=dotcom-footer)
[Pricing](https://github.com/pricing)
[API](https://docs.github.com/)
[Training](https://services.github.com/)
[Blog](https://github.blog/)
[About](https://github.com/about)
How to properly handle demurrage in applications · freicoin/freicoin Wiki

Power BI REST API and Chrome
===
The Power BI REST API and Chrome is a sample Google Chrome extension built to extend Google Chrome into Power BI. The extension sends data inside a web page to Power BI to be analyzed. For more information about the sample, see the [Power BI Blog](http://blogs.msdn.com/b/powerbidev/).
<html class=" responsive" lang="en"><head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
			<meta name="viewport" content="width=device-width,initial-scale=1">
		<meta name="theme-color" content="#171a21">
		<title>Steam, The Ultimate Online Game Platform</title>
	<link rel="shortcut icon" href="/favicon.ico" type="image/x-icon">

	
	
	<link href="https://store.akamai.steamstatic.com/public/shared/css/motiva_sans.css?v=Rc2hpzg2Ex3T&amp;l=english" rel="stylesheet" type="text/css">
<link href="https://store.akamai.steamstatic.com/public/shared/css/shared_global.css?v=mm2EqtpQ_Tvc&amp;l=english" rel="stylesheet" type="text/css">
<link href="https://store.akamai.steamstatic.com/public/shared/css/buttons.css?v=6PFqex5UPprb&amp;l=english" rel="stylesheet" type="text/css">
<link href="https://store.akamai.steamstatic.com/public/css/v6/store.css?v=9sYG9xx_wVKT&amp;l=english" rel="stylesheet" type="text/css">
<link href="https://store.akamai.steamstatic.com/public/css/styles_about.css?v=IaBozbZTT5_Y&amp;l=english" rel="stylesheet" type="text/css">
<link href="https://store.akamai.steamstatic.com/public/css/promo/newstore2016.css?v=Lv_hriLyrQ5z&amp;l=english" rel="stylesheet" type="text/css">
<link href="https://store.akamai.steamstatic.com/public/shared/css/buttons.css?v=6PFqex5UPprb&amp;l=english" rel="stylesheet" type="text/css">
<link href="https://store.akamai.steamstatic.com/public/css/slick/slick.css?v=ZSVHTEnT3WNW&amp;l=english" rel="stylesheet" type="text/css">
<link href="https://store.akamai.steamstatic.com/public/shared/css/shared_responsive.css?v=tzDCtkxeI-e5&amp;l=english" rel="stylesheet" type="text/css">
			<script async="" src="//www.google-analytics.com/analytics.js"></script><script>
				(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
						(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
					m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
				})(window,document,'script','//www.google-analytics.com/analytics.js','ga');

				ga('create', 'UA-33786258-1', 'auto', {
					'sampleRate': 0.4				});
				ga('set', 'dimension1', false );
				ga('set', 'dimension2', 'External' );
				ga('set', 'dimension3', 'about' );
				ga('set', 'dimension4', "about\/about" );
				ga('send', 'pageview' );

			</script>
			<script type="text/javascript" src="https://store.akamai.steamstatic.com/public/shared/javascript/jquery-1.8.3.min.js?v=.TZ2NKhB-nliU"></script>
<script type="text/javascript">$J = jQuery.noConflict();</script><script type="text/javascript">VALVE_PUBLIC_PATH = "https:\/\/store.akamai.steamstatic.com\/public\/";</script><script type="text/javascript" src="https://store.akamai.steamstatic.com/public/shared/javascript/tooltip.js?v=.zYHOpI1L3Rt0"></script>

<script type="text/javascript" src="https://store.akamai.steamstatic.com/public/shared/javascript/shared_global.js?v=QdGk6gWoCXUa&amp;l=english"></script>

<script type="text/javascript" src="https://store.akamai.steamstatic.com/public/javascript/main.js?v=90zQriNTNEnM&amp;l=english"></script>

<script type="text/javascript" src="https://store.akamai.steamstatic.com/public/javascript/dynamicstore.js?v=uk2vdkhDxGM-&amp;l=english"></script>

<script type="text/javascript">
	var __PrototypePreserve=[];
	__PrototypePreserve[0] = Array.from;
	__PrototypePreserve[1] = Array.prototype.filter;
	__PrototypePreserve[2] = Array.prototype.flatMap;
	__PrototypePreserve[3] = Array.prototype.find;
	__PrototypePreserve[4] = Array.prototype.some;
	__PrototypePreserve[5] = Function.prototype.bind;
	__PrototypePreserve[6] = HTMLElement.prototype.scrollTo;
</script>
<script type="text/javascript" src="https://store.akamai.steamstatic.com/public/javascript/prototype-1.7.js?v=.a38iP7Khdmyy"></script>
<script type="text/javascript">
	Array.from = __PrototypePreserve[0] || Array.from;
	Array.prototype.filter = __PrototypePreserve[1] || Array.prototype.filter;
	Array.prototype.flatMap = __PrototypePreserve[2] || Array.prototype.flatMap;
	Array.prototype.find = __PrototypePreserve[3] || Array.prototype.find;
	Array.prototype.some = __PrototypePreserve[4] || Array.prototype.some;
	Function.prototype.bind = __PrototypePreserve[5] || Function.prototype.bind;
	HTMLElement.prototype.scrollTo = __PrototypePreserve[6] || HTMLElement.prototype.scrollTo;
</script>
<script type="text/javascript">
	var __ScriptaculousPreserve=[];
	__ScriptaculousPreserve[0] = Array.from;
	__ScriptaculousPreserve[1] = Function.prototype.bind;
	__ScriptaculousPreserve[2] = HTMLElement.prototype.scrollTo;
</script>
<script type="text/javascript" src="https://store.akamai.steamstatic.com/public/javascript/scriptaculous/_combined.js?v=Me1IBxzktiwk&amp;l=english&amp;load=effects,controls,slider"></script>
<script type="text/javascript">
	Array.from = __ScriptaculousPreserve[0] || Array.from;
	Function.prototype.bind = __ScriptaculousPreserve[1] || Function.prototype.bind;
	HTMLElement.prototype.scrollTo = __ScriptaculousPreserve[2] || HTMLElement.prototype.scrollTo;
</script>
<script type="text/javascript">Object.seal && [ Object, Array, String, Number ].map( function( builtin ) { Object.seal( builtin.prototype ); } );</script>
		<script type="text/javascript">
			document.addEventListener('DOMContentLoaded', function(event) {
				$J.data( document, 'x_readytime', new Date().getTime() );
				$J.data( document, 'x_oldref', GetNavCookie() );
				SetupTooltips( { tooltipCSSClass: 'store_tooltip'} );
		});
		</script><script type="text/javascript" src="https://store.akamai.steamstatic.com/public/javascript/about.js?v=T9HhtJ81mJgN&amp;l=english"></script>
<script type="text/javascript" src="https://store.akamai.steamstatic.com/public/javascript/slick/slick.js?v=.UvbXNQdQm-AJ"></script>
<script type="text/javascript" src="https://store.akamai.steamstatic.com/public/javascript/rellax/rellax.min.js?v=.KbIxshHXB6Um"></script>
<script type="text/javascript" src="https://store.akamai.steamstatic.com/public/shared/javascript/shared_responsive_adapter.js?v=pSvIAKtunfWg&amp;l=english"></script>

						<meta name="twitter:card" content="summary_large_image">
					<meta name="Description" content="Steam is the ultimate destination for playing, discussing, and creating games.">
			
	<meta name="twitter:site" content="@steam">

						<meta property="og:title" content="Steam, The Ultimate Online Game Platform">
					<meta property="twitter:title" content="Steam, The Ultimate Online Game Platform">
					<meta property="og:type" content="website">
					<meta property="fb:app_id" content="105386699540688">
					<meta property="og:site" content="Steam">
					<meta property="og:description" content="Steam is the ultimate destination for playing, discussing, and creating games.">
					<meta property="twitter:description" content="Steam is the ultimate destination for playing, discussing, and creating games.">
			
	
			<link rel="image_src" href="https://cdn.akamai.steamstatic.com/store/about/social-og.jpg">
		<meta property="og:image" content="https://cdn.akamai.steamstatic.com/store/about/social-og.jpg">
		<meta name="twitter:image" content="https://cdn.akamai.steamstatic.com/store/about/social-og.jpg">
				
	
	
	
	
	</head>
<body class="v6 promoannounce responsive_page ">


<div class="responsive_page_frame with_header">
						<div class="responsive_page_menu_ctn mainmenu">
				<div class="responsive_page_menu" id="responsive_page_menu">
										<div class="mainmenu_contents">
						<div class="mainmenu_contents_items">
															<a class="menuitem" href="https://store.steampowered.com/login/?redir=about%2F%3Fsnr%3D1_430_4__global-header&amp;redir_ssl=1&amp;snr=1_14_4__global-header">
									Login								</a>
								<a class="menuitem supernav" href="https://store.steampowered.com/?snr=1_14_4__global-responsive-menu" data-tooltip-type="selector" data-tooltip-content=".submenu_store">
		Store	</a>
	<div class="submenu_store" style="display: none;" data-submenuid="store">
		<a class="submenuitem" href="https://store.steampowered.com/?snr=1_14_4__global-responsive-menu">Home</a>
					<a class="submenuitem" href="https://store.steampowered.com/explore/?snr=1_14_4__global-responsive-menu">Discovery Queue</a>
				<a class="submenuitem" href="https://steamcommunity.com/my/wishlist/">Wishlist</a>
		<a class="submenuitem" href="https://store.steampowered.com/points/shop/?snr=1_14_4__global-responsive-menu">Points Shop</a>	
       	<a class="submenuitem" href="https://store.steampowered.com/news/?snr=1_14_4__global-responsive-menu">News</a>
					<a class="submenuitem" href="https://store.steampowered.com/stats/?snr=1_14_4__global-responsive-menu">Stats</a>
					</div>


			<a class="menuitem supernav" style="display: block" href="https://steamcommunity.com/" data-tooltip-type="selector" data-tooltip-content=".submenu_community">
			Community		</a>
		<div class="submenu_community" style="display: none;" data-submenuid="community">
			<a class="submenuitem" href="https://steamcommunity.com/">Home</a>
			<a class="submenuitem" href="https://steamcommunity.com/discussions/">Discussions</a>
			<a class="submenuitem" href="https://steamcommunity.com/workshop/">Workshop</a>
			<a class="submenuitem" href="https://steamcommunity.com/market/">Market</a>
			<a class="submenuitem" href="https://steamcommunity.com/?subsection=broadcasts">Broadcasts</a>
											</div>
		

	
	
	<a class="menuitem" href="https://help.steampowered.com/en/">
		Support	</a>

							<div class="minor_menu_items">
																								<div class="menuitem change_language_action">
									Change language								</div>
																																	<div class="menuitem" onclick="Responsive_RequestDesktopView();">
										View desktop website									</div>
															</div>
						</div>
						<div class="mainmenu_footer_spacer  "></div>
						<div class="mainmenu_footer">
															<div class="mainmenu_footer_logo"><img src="https://store.akamai.steamstatic.com/public/shared/images/responsive/logo_valve_footer.png"></div>
								© Valve Corporation. All rights reserved. All trademarks are property of their respective owners in the US and other countries.								<span class="mainmenu_valve_links">
									<a href="https://store.steampowered.com/privacy_agreement/?snr=1_14_4__global-responsive-menu" target="_blank">Privacy Policy</a>
									&nbsp;| &nbsp;<a href="http://www.valvesoftware.com/legal.htm" target="_blank">Legal</a>
									&nbsp;| &nbsp;<a href="https://store.steampowered.com/subscriber_agreement/?snr=1_14_4__global-responsive-menu" target="_blank">Steam Subscriber Agreement</a>
									&nbsp;| &nbsp;<a href="https://store.steampowered.com/steam_refunds/?snr=1_14_4__global-responsive-menu" target="_blank">Refunds</a>
								</span>
													</div>
					</div>
									</div>
			</div>
		
		<div class="responsive_local_menu_tab"></div>

		<div class="responsive_page_menu_ctn localmenu">
			<div class="responsive_page_menu" id="responsive_page_local_menu" data-panel="{&quot;onOptionsActionDescription&quot;:&quot;Filter&quot;,&quot;onOptionsButton&quot;:&quot;Responsive_ToggleLocalMenu()&quot;,&quot;onCancelButton&quot;:&quot;Responsive_ToggleLocalMenu()&quot;}">
				<div class="localmenu_content" data-panel="{&quot;maintainY&quot;:true,&quot;bFocusRingRoot&quot;:true,&quot;flow-children&quot;:&quot;column&quot;}">
				</div>
			</div>
		</div>



					<div class="responsive_header">
				<div class="responsive_header_content">
					<div id="responsive_menu_logo">
						<img src="https://store.akamai.steamstatic.com/public/shared/images/responsive/header_menu_hamburger.png" height="100%">
											</div>
					<div class="responsive_header_logo">
						<a href="https://store.steampowered.com/?snr=1_14_4__global-responsive-menu">
															<img src="https://store.akamai.steamstatic.com/public/shared/images/responsive/header_logo.png" height="36" border="0" alt="STEAM">
													</a>
					</div>
				</div>
			</div>
		
		<div class="responsive_page_content_overlay">

		</div>

		<div class="responsive_fixonscroll_ctn nonresponsive_hidden ">
		</div>
	
	<div class="responsive_page_content">

		<div id="global_header" data-panel="{&quot;flow-children&quot;:&quot;row&quot;}">
	<div class="content">
		<div class="logo">
			<span id="logo_holder">
									<a href="https://store.steampowered.com/?snr=1_14_4__global-header">
						<img src="https://store.akamai.steamstatic.com/public/shared/images/header/logo_steam.svg?t=962016" width="176" height="44">
					</a>
							</span>
		</div>

			<div class="supernav_container">
	<a class="menuitem supernav" href="https://store.steampowered.com/?snr=1_14_4__global-header" data-tooltip-type="selector" data-tooltip-content=".submenu_store">
		STORE	</a>
	<div class="submenu_store" style="display: none;" data-submenuid="store">
		<a class="submenuitem" href="https://store.steampowered.com/?snr=1_14_4__global-header">Home</a>
					<a class="submenuitem" href="https://store.steampowered.com/explore/?snr=1_14_4__global-header">Discovery Queue</a>
				<a class="submenuitem" href="https://steamcommunity.com/my/wishlist/">Wishlist</a>
		<a class="submenuitem" href="https://store.steampowered.com/points/shop/?snr=1_14_4__global-header">Points Shop</a>	
       	<a class="submenuitem" href="https://store.steampowered.com/news/?snr=1_14_4__global-header">News</a>
					<a class="submenuitem" href="https://store.steampowered.com/stats/?snr=1_14_4__global-header">Stats</a>
					</div>


			<a class="menuitem supernav" style="display: block" href="https://steamcommunity.com/" data-tooltip-type="selector" data-tooltip-content=".submenu_community">
			COMMUNITY		</a>
		<div class="submenu_community" style="display: none;" data-submenuid="community">
			<a class="submenuitem" href="https://steamcommunity.com/">Home</a>
			<a class="submenuitem" href="https://steamcommunity.com/discussions/">Discussions</a>
			<a class="submenuitem" href="https://steamcommunity.com/workshop/">Workshop</a>
			<a class="submenuitem" href="https://steamcommunity.com/market/">Market</a>
			<a class="submenuitem" href="https://steamcommunity.com/?subsection=broadcasts">Broadcasts</a>
											</div>
		

	
						<a class="menuitem" href="https://store.steampowered.com/about/?snr=1_14_4__global-header">
				ABOUT			</a>
			
	<a class="menuitem" href="https://help.steampowered.com/en/">
		SUPPORT	</a>
	</div>
	<script type="text/javascript">
		jQuery(function($) {
			$('#global_header .supernav').v_tooltip({'location':'bottom', 'destroyWhenDone': false, 'tooltipClass': 'supernav_content', 'offsetY':-4, 'offsetX': 1, 'horizontalSnap': 4, 'tooltipParent': '#global_header .supernav_container', 'correctForScreenSize': false});
		});
	</script>

		<div id="global_actions">
			<div id="global_action_menu">
									<div class="header_installsteam_btn header_installsteam_btn_green">

						<a class="header_installsteam_btn_content" href="https://store.steampowered.com/about/?snr=1_14_4__global-header">
							Install Steam						</a>
					</div>
				
				
														<a class="global_action_link" href="https://store.steampowered.com/login/?redir=about%2F%3Fsnr%3D1_430_4__global-header&amp;redir_ssl=1&amp;snr=1_14_4__global-header">login</a>
											&nbsp;|&nbsp;
						<span class="pulldown global_action_link" id="language_pulldown" onclick="ShowMenu( this, 'language_dropdown', 'right' );">language</span>
						<div class="popup_block_new" id="language_dropdown" style="display: none;">
							<div class="popup_body popup_menu">
																																					<a class="popup_menu_item tight" href="?l=schinese&amp;snr=1_430_4__global-header" onclick="ChangeLanguage( 'schinese' ); return false;">简体中文 (Simplified Chinese)</a>
																													<a class="popup_menu_item tight" href="?l=tchinese&amp;snr=1_430_4__global-header" onclick="ChangeLanguage( 'tchinese' ); return false;">繁體中文 (Traditional Chinese)</a>
																													<a class="popup_menu_item tight" href="?l=japanese&amp;snr=1_430_4__global-header" onclick="ChangeLanguage( 'japanese' ); return false;">日本語 (Japanese)</a>
																													<a class="popup_menu_item tight" href="?l=koreana&amp;snr=1_430_4__global-header" onclick="ChangeLanguage( 'koreana' ); return false;">한국어 (Korean)</a>
																													<a class="popup_menu_item tight" href="?l=thai&amp;snr=1_430_4__global-header" onclick="ChangeLanguage( 'thai' ); return false;">ไทย (Thai)</a>
																													<a class="popup_menu_item tight" href="?l=bulgarian&amp;snr=1_430_4__global-header" onclick="ChangeLanguage( 'bulgarian' ); return false;">Български (Bulgarian)</a>
																													<a class="popup_menu_item tight" href="?l=czech&amp;snr=1_430_4__global-header" onclick="ChangeLanguage( 'czech' ); return false;">Čeština (Czech)</a>
																													<a class="popup_menu_item tight" href="?l=danish&amp;snr=1_430_4__global-header" onclick="ChangeLanguage( 'danish' ); return false;">Dansk (Danish)</a>
																													<a class="popup_menu_item tight" href="?l=german&amp;snr=1_430_4__global-header" onclick="ChangeLanguage( 'german' ); return false;">Deutsch (German)</a>
																																							<a class="popup_menu_item tight" href="?l=spanish&amp;snr=1_430_4__global-header" onclick="ChangeLanguage( 'spanish' ); return false;">Español - España (Spanish - Spain)</a>
																													<a class="popup_menu_item tight" href="?l=latam&amp;snr=1_430_4__global-header" onclick="ChangeLanguage( 'latam' ); return false;">Español - Latinoamérica (Spanish - Latin America)</a>
																													<a class="popup_menu_item tight" href="?l=greek&amp;snr=1_430_4__global-header" onclick="ChangeLanguage( 'greek' ); return false;">Ελληνικά (Greek)</a>
																													<a class="popup_menu_item tight" href="?l=french&amp;snr=1_430_4__global-header" onclick="ChangeLanguage( 'french' ); return false;">Français (French)</a>
																													<a class="popup_menu_item tight" href="?l=italian&amp;snr=1_430_4__global-header" onclick="ChangeLanguage( 'italian' ); return false;">Italiano (Italian)</a>
																													<a class="popup_menu_item tight" href="?l=hungarian&amp;snr=1_430_4__global-header" onclick="ChangeLanguage( 'hungarian' ); return false;">Magyar (Hungarian)</a>
																													<a class="popup_menu_item tight" href="?l=dutch&amp;snr=1_430_4__global-header" onclick="ChangeLanguage( 'dutch' ); return false;">Nederlands (Dutch)</a>
																													<a class="popup_menu_item tight" href="?l=norwegian&amp;snr=1_430_4__global-header" onclick="ChangeLanguage( 'norwegian' ); return false;">Norsk (Norwegian)</a>
																													<a class="popup_menu_item tight" href="?l=polish&amp;snr=1_430_4__global-header" onclick="ChangeLanguage( 'polish' ); return false;">Polski (Polish)</a>
																													<a class="popup_menu_item tight" href="?l=portuguese&amp;snr=1_430_4__global-header" onclick="ChangeLanguage( 'portuguese' ); return false;">Português (Portuguese - Portugal)</a>
																													<a class="popup_menu_item tight" href="?l=brazilian&amp;snr=1_430_4__global-header" onclick="ChangeLanguage( 'brazilian' ); return false;">Português - Brasil (Portuguese - Brazil)</a>
																													<a class="popup_menu_item tight" href="?l=romanian&amp;snr=1_430_4__global-header" onclick="ChangeLanguage( 'romanian' ); return false;">Română (Romanian)</a>
																													<a class="popup_menu_item tight" href="?l=russian&amp;snr=1_430_4__global-header" onclick="ChangeLanguage( 'russian' ); return false;">Русский (Russian)</a>
																													<a class="popup_menu_item tight" href="?l=finnish&amp;snr=1_430_4__global-header" onclick="ChangeLanguage( 'finnish' ); return false;">Suomi (Finnish)</a>
																													<a class="popup_menu_item tight" href="?l=swedish&amp;snr=1_430_4__global-header" onclick="ChangeLanguage( 'swedish' ); return false;">Svenska (Swedish)</a>
																													<a class="popup_menu_item tight" href="?l=turkish&amp;snr=1_430_4__global-header" onclick="ChangeLanguage( 'turkish' ); return false;">Türkçe (Turkish)</a>
																													<a class="popup_menu_item tight" href="?l=vietnamese&amp;snr=1_430_4__global-header" onclick="ChangeLanguage( 'vietnamese' ); return false;">Tiếng Việt (Vietnamese)</a>
																													<a class="popup_menu_item tight" href="?l=ukrainian&amp;snr=1_430_4__global-header" onclick="ChangeLanguage( 'ukrainian' ); return false;">Українська (Ukrainian)</a>
																									<a class="popup_menu_item tight" href="https://www.valvesoftware.com/en/contact?contact-person=Translation%20Team%20Feedback" target="_blank">Report a translation problem</a>
							</div>
						</div>
												</div>
					</div>
			</div>
</div>
<div id="responsive_store_nav_ctn"></div><div id="responsive_store_nav_overlay" style="display:none"><div id="responsive_store_nav_overlay_ctn"></div><div id="responsive_store_nav_overlay_bottom"></div></div><div id="responsive_store_search_overlay" style="display:none"></div><div data-cart-banner-spot="1"></div>
		<div class="responsive_page_template_content" id="responsive_page_template_content" data-panel="{&quot;autoFocus&quot;:true}">

			<script type="text/javascript">
	var g_AccountID = 0;
	var g_sessionID = "86eabc45d748bd142fc018bf";
	var g_ServerTime = 1675685941;

	$J( InitMiniprofileHovers );

	
			GStoreItemData.AddNavParams({
			__page_default: "1_14_4_",
			storemenu_recommendedtags: "1_14_4__17"		});
		GDynamicStore.Init( 0, false, "", {"primary_language":null,"secondary_languages":null,"platform_windows":null,"platform_mac":null,"platform_linux":null,"timestamp_updated":null,"hide_store_broadcast":null,"review_score_preference":null,"timestamp_content_descriptor_preferences_updated":null,"provide_deck_feedback":null,"additional_languages":null}, 'US',
			{"bNoDefaultDescriptors":false} );
		GStoreItemData.SetCurrencyFormatter( function( nValueInCents, bWholeUnitsOnly ) { var fmt = function( nValueInCents, bWholeUnitsOnly ) {	var format = v_numberformat( nValueInCents / 100, bWholeUnitsOnly ? 0 : 2, ".", ","); return format; };var strNegativeSymbol = '';	if ( nValueInCents < 0 ) { strNegativeSymbol = '-'; nValueInCents = -nValueInCents; }return strNegativeSymbol + "$" + fmt( nValueInCents, bWholeUnitsOnly );} );
		GStoreItemData.SetCurrencyMinPriceIncrement( 1 );
	</script>

<div id="about_header_area">
	<div class="about_area_inner_wrapper">
		<div id="about_monitor_video">
			<video width="100%" height="auto" autoplay="" muted="" loop="" poster="https://cdn.akamai.steamstatic.com/store/about/videos/about_hero_loop_web.png">
									<source src="https://cdn.akamai.steamstatic.com/store/about/videos/about_hero_loop_web.webm" type="video/webm">
					<source src="https://cdn.akamai.steamstatic.com/store/about/videos/about_hero_loop_web.mp4" type="video/mp4">
							</video>
			<div id="about_monitor_video_gradient"></div>
		</div>
		<div id="about_header">
			<div id="about_greeting">

				<div class="steam_logo"><img src="https://cdn.akamai.steamstatic.com/store//about/logo_steam.svg" alt="The logo for Steam"></div>
				<div class="about_subtitle">Steam is the ultimate destination for playing, discussing, and creating games.</div>
									<div class="online_stats">
						<div class="online_stat">
							<div class="online_stat_label gamers_online">online</div>
							26,142,270						</div>
						<div class="online_stat">
							<div class="online_stat_label gamers_in_game">playing now</div>
							6,739,459						</div>
					</div>
				
				<div class="about_install_wrapper">
	<div class="about_install win ">
							<a href="https://cdn.akamai.steamstatic.com/client/installer/SteamSetup.exe" class="about_install_steam_link">Install Steam</a>
				</div>
			<div class="installer_list">
			<div class="available_platforms">
				Also available on:
			</div>

										<a class="platform_icon" href="https://cdn.akamai.steamstatic.com/client/installer/steam.dmg">
					<img src="https://cdn.akamai.steamstatic.com/store/about/icon-macos.svg">
				</a>
										<a class="platform_icon" href="https://cdn.akamai.steamstatic.com/client/installer/steam.deb">
					<img src="https://cdn.akamai.steamstatic.com/store/about/icon-steamos.svg">
				</a>
					</div>
	</div>
			</div>
		</div>
	</div>
	<div class="learn_more_btn">
		<a href="#about_games_cta_area" class="smooth_scroll">
			Learn more			<span class="down_arrow"></span>
		</a>
	</div>
</div>

<div id="about_games_cta_area">
	<div class="about_games_cta_bg"></div>
	<div class="about_area_inner_wrapper">
		<div id="about_games_cta">
			<div id="about_games_hero" class="cta_hero">

				<div class="games_col" id="games_col_left">
											<div class="game_image" data-rellax-percentage="0.5" data-rellax-speed="0.8" style="transform: translate3d(0px, 137px, 0px);">
							<a href="https://store.steampowered.com/app/990080/Hogwarts_Legacy/">
								<img src="https://cdn.akamai.steamstatic.com/steam/apps/990080/capsule_231x87.jpg?t=1675377506">
							</a>
						</div>

												<div class="game_image" data-rellax-percentage="0.5" data-rellax-speed="0.8" style="transform: translate3d(0px, 85px, 0px);">
							<a href="https://store.steampowered.com/app/730/CounterStrike_Global_Offensive/">
								<img src="https://cdn.akamai.steamstatic.com/steam/apps/730/capsule_231x87.jpg?t=1668125812">
							</a>
						</div>

												<div class="game_image" data-rellax-percentage="0.5" data-rellax-speed="0.8" style="transform: translate3d(0px, 118px, 0px);">
							<a href="https://store.steampowered.com/app/1693980/Dead_Space/">
								<img src="https://cdn.akamai.steamstatic.com/steam/apps/1693980/capsule_231x87.jpg?t=1675296307">
							</a>
						</div>

												<div class="game_image" data-rellax-percentage="0.5" data-rellax-speed="0.8" style="transform: translate3d(0px, 65px, 0px);">
							<a href="https://store.steampowered.com/app/1599340/Lost_Ark/">
								<img src="https://cdn.akamai.steamstatic.com/steam/apps/1599340/capsule_231x87.jpg?t=1675194930">
							</a>
						</div>

												<div class="game_image" data-rellax-percentage="0.5" data-rellax-speed="1.5" style="transform: translate3d(0px, 240px, 0px);">
							<a href="https://store.steampowered.com/app/1938090/Call_of_Duty_Modern_Warfare_II/">
								<img src="https://cdn.akamai.steamstatic.com/steam/apps/1938090/capsule_231x87.jpg?t=1675274544">
							</a>
						</div>

												<div class="game_image" data-rellax-percentage="0.5" data-rellax-speed="1.5" style="transform: translate3d(0px, 128px, 0px);">
							<a href="https://store.steampowered.com/app/311210/Call_of_Duty_Black_Ops_III/">
								<img src="https://cdn.akamai.steamstatic.com/steam/apps/311210/capsule_231x87.jpg?t=1646763462">
							</a>
						</div>

												<div class="game_image" data-rellax-percentage="0.5" data-rellax-speed="3" style="transform: translate3d(0px, 334px, 0px);">
							<a href="https://store.steampowered.com/app/1451190/Undisputed/">
								<img src="https://cdn.akamai.steamstatic.com/steam/apps/1451190/capsule_231x87.jpg?t=1675440598">
							</a>
						</div>

												<div class="game_image" data-rellax-percentage="0.5" data-rellax-speed="3" style="transform: translate3d(0px, 441px, 0px);">
							<a href="https://store.steampowered.com/app/1059530/Valve_Index_Headset/">
								<img src="https://cdn.akamai.steamstatic.com/steam/apps/1059530/capsule_231x87.jpg?t=1645043152">
							</a>
						</div>

										</div>
				<div class="games_col" id="games_col_right">
											<div class="game_image" data-rellax-percentage="0.5" data-rellax-speed="0.8" style="transform: translate3d(0px, 137px, 0px);">
							<a href="https://store.steampowered.com/app/1675200/Steam_Deck/">
								<img src="https://cdn.akamai.steamstatic.com/steam/apps/1675200/capsule_231x87.jpg?t=1656364857">
							</a>
						</div>

												<div class="game_image" data-rellax-percentage="0.5" data-rellax-speed="0.8" style="transform: translate3d(0px, 85px, 0px);">
							<a href="https://store.steampowered.com/app/1085660/Destiny_2/">
								<img src="https://cdn.akamai.steamstatic.com/steam/apps/1085660/capsule_231x87.jpg?t=1671639469">
							</a>
						</div>

												<div class="game_image" data-rellax-percentage="0.5" data-rellax-speed="0.8" style="transform: translate3d(0px, 118px, 0px);">
							<a href="https://store.steampowered.com/app/1172470/Apex_Legends/">
								<img src="https://cdn.akamai.steamstatic.com/steam/apps/1172470/capsule_231x87.jpg?t=1670431796">
							</a>
						</div>

												<div class="game_image" data-rellax-percentage="0.5" data-rellax-speed="1.5" style="transform: translate3d(0px, 123px, 0px);">
							<a href="https://store.steampowered.com/app/236390/War_Thunder/">
								<img src="https://cdn.akamai.steamstatic.com/steam/apps/236390/capsule_231x87.jpg?t=1671733778">
							</a>
						</div>

												<div class="game_image" data-rellax-percentage="0.5" data-rellax-speed="1.5" style="transform: translate3d(0px, 240px, 0px);">
							<a href="https://store.steampowered.com/app/39210/FINAL_FANTASY_XIV_Online/">
								<img src="https://cdn.akamai.steamstatic.com/steam/apps/39210/capsule_231x87.jpg?t=1669805579">
							</a>
						</div>

												<div class="game_image" data-rellax-percentage="0.5" data-rellax-speed="1.5" style="transform: translate3d(0px, 128px, 0px);">
							<a href="https://store.steampowered.com/app/1817230/HiFi_RUSH/">
								<img src="https://cdn.akamai.steamstatic.com/steam/apps/1817230/capsule_231x87.jpg?t=1675347521">
							</a>
						</div>

												<div class="game_image" data-rellax-percentage="0.5" data-rellax-speed="3" style="transform: translate3d(0px, 334px, 0px);">
							<a href="https://store.steampowered.com/app/1817070/Marvels_SpiderMan_Remastered/">
								<img src="https://cdn.akamai.steamstatic.com/steam/apps/1817070/capsule_231x87.jpg?t=1673999865">
							</a>
						</div>

												<div class="game_image" data-rellax-percentage="0.5" data-rellax-speed="3" style="transform: translate3d(0px, 441px, 0px);">
							<a href="https://store.steampowered.com/app/1245620/ELDEN_RING/">
								<img src="https://cdn.akamai.steamstatic.com/steam/apps/1245620/capsule_231x87.jpg?t=1674441703">
							</a>
						</div>

										</div>
			</div>
			<div class="cta_content">
				<h2 class="cta_title">
					Access Games Instantly				</h2>
				<div class="cta_text">
										With nearly 30,000 games from AAA to indie and everything in-between. Enjoy exclusive deals, automatic game updates, and other great perks.				</div>
				<div class="cta_btn">
					<a href="https://store.steampowered.com/">
						Browse the Store					</a>
				</div>
			</div>
		</div>
	</div>
</div>

	<div id="about_ctas_area">
		<div class="about_area_inner_wrapper">
			<div id="about_ctas">
				<div id="about_cta_community" class="about_cta">
					<div class="cta_hero">
						<img id="hero_community" class="hero_complete" src="https://cdn.akamai.steamstatic.com/store/about/cta_hero_community.png">
						<img id="hero_community_pt1" src="https://cdn.akamai.steamstatic.com/store/about/cta_hero_community_pt1.png">
						<img id="hero_community_pt2" src="https://cdn.akamai.steamstatic.com/store/about/cta_hero_community_pt2.png">
						<img id="hero_community_pt3" src="https://cdn.akamai.steamstatic.com/store/about/cta_hero_community_pt3.png">
					</div>
					<div class="cta_content">
						<h2 class="cta_title">
							Join the Community						</h2>
						<div class="cta_text">
							Meet new people, join groups, form clans, chat in-game and more! With over 100 million potential friends (or enemies), the fun never stops.						</div>
						<div class="cta_btn">
							<a href="https://steamcommunity.com/">
								Visit the Community							</a>
						</div>
					</div>
				</div>
				<div id="about_cta_hardware" class="about_cta">
					<div class="cta_hero">
						<img id="hero_hardware" class="hero_complete" src="https://cdn.akamai.steamstatic.com/store/about/cta_hero_hardware.png">
						<img id="hero_hardware_pt1" src="https://cdn.akamai.steamstatic.com/store/about/cta_hero_hardware_pt1.png">
						<img id="hero_hardware_pt2" src="https://cdn.akamai.steamstatic.com/store/about/cta_hero_hardware_pt2.png">
					</div>
					<div class="cta_content">
						<h2 class="cta_title">
							Experience Steam Hardware						</h2>
						<div class="cta_text">
							We created the Steam Controller and the VR technologies that power the HTC Vive to making gaming on the PC even better.						</div>
						<div class="cta_btn">
							<a href="https://store.steampowered.com/search/?category1=993">
								Experience Steam Hardware							</a>
						</div>
					</div>
				</div>
				<div id="about_cta_steamworks" class="about_cta">
					<div class="cta_hero">
						<img id="hero_steamworks" class="hero_complete" src="https://cdn.akamai.steamstatic.com/store/about/cta_hero_steamworks.png">
						<img id="hero_steamworks_pt1" src="https://cdn.akamai.steamstatic.com/store/about/cta_hero_steamworks_pt1.png">
						<img id="hero_steamworks_pt2" src="https://cdn.akamai.steamstatic.com/store/about/cta_hero_steamworks_pt2.png">
					</div>
					<div class="cta_content">
						<div class="logo_steamworks">
							<img src="https://cdn.akamai.steamstatic.com/store/about/logo-steamworks.svg">
						</div>
						<h2 class="cta_title">
							Release your Game						</h2>
						<div class="cta_text">
							Steamworks is the set of tools and services that help game developers and publishers get the most out of distributing games on Steam.						</div>
						<div class="cta_btn">
							<a href="https://partner.steamgames.com/">
								Learn about Steamworks							</a>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

<div id="about_steam_features_area">
	<div class="about_area_inner_wrapper">
		<div id="about_steam_features">
			<h1 id="about_steam_feature_title">
				Features			</h1>
			<div id="about_steam_feature_subtitle">
				We are constantly working to bring new updates and features to Steam, such as:			</div>
			<div id="about_steam_features_grid" class="features_grid">
										<div id="about_feature_steamchat" class="feature">
		<a href="https://steamcommunity.com/updates/chatupdate">
			<div class="about_feature_icon">
				<img src="https://cdn.akamai.steamstatic.com/store/about/icon-steamchat.svg">
			</div>
			<div class="about_feature_content">
				<h3 class="feature_title">
					Steam Chat				</h3>
				<div class="feature_text">
					Talk with friends or groups via text or voice without leaving Steam. Videos, Tweets, GIFs and more are supported; use wisely.				</div>
				<div class="feature_btn">
					Learn More				</div>
			</div>
		</a>
	</div>
					
										<div id="about_feature_gamehubs" class="feature">
		<a href="https://steamcommunity.com/communitycontent/">
			<div class="about_feature_icon">
				<img src="https://cdn.akamai.steamstatic.com/store/about/icon-gamehubs.svg">
			</div>
			<div class="about_feature_content">
				<h3 class="feature_title">
					Game Hubs				</h3>
				<div class="feature_text">
					Everything about your game, all in one place. Join discussions, upload content, and be the first to know about new updates.				</div>
				<div class="feature_btn">
					Learn More				</div>
			</div>
		</a>
	</div>
							<div id="about_feature_steambroadcasts" class="feature">
		<a href="https://steamcommunity.com/updates/broadcasting">
			<div class="about_feature_icon">
				<img src="https://cdn.akamai.steamstatic.com/store/about/icon-broadcasts.svg">
			</div>
			<div class="about_feature_content">
				<h3 class="feature_title">
					Steam Broadcast				</h3>
				<div class="feature_text">
					Stream your gameplay live with the click of a button, and share your game with friends or the rest of the community.				</div>
				<div class="feature_btn">
					Learn More				</div>
			</div>
		</a>
	</div>
							<div id="about_feature_steamworkshop" class="feature">
		<a href="https://steamcommunity.com//workshop">
			<div class="about_feature_icon">
				<img src="https://cdn.akamai.steamstatic.com/store/about/icon-steamworkshop.svg">
			</div>
			<div class="about_feature_content">
				<h3 class="feature_title">
					Steam Workshop				</h3>
				<div class="feature_text">
					Create, discover, and download player-created mods and cosmetics for nearly 1,000 supported games.				</div>
				<div class="feature_btn">
					Learn More				</div>
			</div>
		</a>
	</div>
							<div id="about_feature_steammobile" class="feature">
		<a href="https://store.steampowered.com//mobile">
			<div class="about_feature_icon">
				<img src="https://cdn.akamai.steamstatic.com/store/about/icon-steammobile.svg">
			</div>
			<div class="about_feature_content">
				<h3 class="feature_title">
					Available on Mobile				</h3>
				<div class="feature_text">
					Access Steam anywhere from your iOS or Android device with the Steam mobile app.				</div>
				<div class="feature_btn">
					Learn More				</div>
			</div>
		</a>
	</div>
					
										<div id="about_feature_earlyaccess" class="feature">
		<a href="https://store.steampowered.com/genre/Early%20Access/">
			<div class="about_feature_icon">
				<img src="https://cdn.akamai.steamstatic.com/store/about/icon-earlyaccess.svg">
			</div>
			<div class="about_feature_content">
				<h3 class="feature_title">
					Early Access to Games				</h3>
				<div class="feature_text">
					Discover, play, and get involved with games as they evolve. Be the first to see what's coming and become part of the process.				</div>
				<div class="feature_btn">
					Learn More				</div>
			</div>
		</a>
	</div>
					

										<div id="about_feature_languages" class="feature">
		<div class="about_feature_icon">
			<img src="https://cdn.akamai.steamstatic.com/store/about/icon-languages.svg">
		</div>
		<div class="about_feature_content">
			<h3 class="feature_title">
				Multilingual			</h3>
			<div class="feature_text">
				Creating a global community is important to us, that's why our client supports 28 languages and counting.			</div>
		</div>
	</div>
							<div id="about_feature_payment" class="feature">
		<div class="about_feature_icon">
			<img src="https://cdn.akamai.steamstatic.com/store/about/icon-payment.svg">
		</div>
		<div class="about_feature_content">
			<h3 class="feature_title">
				Purchases Made Easy			</h3>
			<div class="feature_text">
				Our storefront supports 100+ payment methods across over 35 currencies, giving you the flexibility to pay how you want.			</div>
		</div>
	</div>
										<div id="about_feature_controllers" class="feature">
		<div class="about_feature_icon">
			<img src="https://cdn.akamai.steamstatic.com/store/about/icon-controllers.svg">
		</div>
		<div class="about_feature_content">
			<h3 class="feature_title">
				Controller Support			</h3>
			<div class="feature_text">
				Steam encourages developers to include controller support in their games including PlayStation, Xbox, and Nintendo controllers.			</div>
		</div>
	</div>
								</div>
			<div id="about_features_more">
				<div class="content">
					<h3 id="about_features_more_title">
						And so much more...					</h3>
					<div id="about_features_more_text">
						Earn achievements, read reviews, explore custom recommendations, and more.					</div>
				</div>

				<div class="about_install_wrapper">
	<div class="about_install win ">
							<a href="https://cdn.akamai.steamstatic.com/client/installer/SteamSetup.exe" class="about_install_steam_link">Install Steam</a>
				</div>
			<div class="installer_list">
			<div class="available_platforms">
				Also available on:
			</div>

										<a class="platform_icon" href="https://cdn.akamai.steamstatic.com/client/installer/steam.dmg">
					<img src="https://cdn.akamai.steamstatic.com/store/about/icon-macos.svg">
				</a>
										<a class="platform_icon" href="https://cdn.akamai.steamstatic.com/client/installer/steam.deb">
					<img src="https://cdn.akamai.steamstatic.com/store/about/icon-steamos.svg">
				</a>
					</div>
	</div>			</div>
		</div>
	</div>
</div>

<!-- Footer -->
<div id="footer_spacer" style="" class=""></div>
<div id="footer" class="">
<div class="footer_content">

    <div class="rule"></div>
				<div id="footer_logo_steam"><img src="https://store.akamai.steamstatic.com/public/images/v6/logo_steam_footer.png" alt="Valve Software" border="0"></div>
	
    <div id="footer_logo"><a href="http://www.valvesoftware.com" target="_blank" rel=""><img src="https://store.akamai.steamstatic.com/public/images/footerLogo_valve_new.png" alt="Valve Software" border="0"></a></div>
    <div id="footer_text" data-panel="{&quot;flow-children&quot;:&quot;row&quot;}">
        <div>© 2023 Valve Corporation.  All rights reserved.  All trademarks are property of their respective owners in the US and other countries.</div>
        <div>VAT included in all prices where applicable.&nbsp;&nbsp;

            <a href="https://store.steampowered.com/privacy_agreement/?snr=1_44_44_" target="_blank" rel="">Privacy Policy</a>
            &nbsp; | &nbsp;
            <a href="https://store.steampowered.com/legal/?snr=1_44_44_" target="_blank" rel="">Legal</a>
            &nbsp; | &nbsp;
            <a href="https://store.steampowered.com/subscriber_agreement/?snr=1_44_44_" target="_blank" rel="">Steam Subscriber Agreement</a>
            &nbsp; | &nbsp;
            <a href="https://store.steampowered.com/steam_refunds/?snr=1_44_44_" target="_blank" rel="">Refunds</a>
            &nbsp; | &nbsp;
            <a href="https://store.steampowered.com/account/cookiepreferences/?snr=1_44_44_" target="_blank" rel="">Cookies</a>

        </div>
					<div class="responsive_optin_link">
				<div class="btn_medium btnv6_grey_black" onclick="Responsive_RequestMobileView()">
					<span>View mobile website</span>
				</div>			</div>
    </div>
    <div style="clear: left;"></div>
	<br>
    <div class="rule"></div>
    <div class="valve_links" data-panel="{&quot;flow-children&quot;:&quot;row&quot;}">
        <a href="http://www.valvesoftware.com/about" target="_blank" rel="">About Valve</a>
        &nbsp; | &nbsp;<a href="http://www.valvesoftware.com" target="_blank" rel="">Jobs</a>
        &nbsp; | &nbsp;<a href="http://www.steampowered.com/steamworks/" target="_blank" rel="">Steamworks</a>
        &nbsp; | &nbsp;<a href="https://partner.steamgames.com/steamdirect" target="_blank" rel="">Steam Distribution</a>
        &nbsp; | &nbsp;<a href="https://help.steampowered.com/en/?snr=1_44_44_">Support</a>
        		&nbsp; | &nbsp;<a href="https://store.steampowered.com/digitalgiftcards/?snr=1_44_44_" target="_blank" rel="">Gift Cards</a>
		&nbsp; | &nbsp;<a href="https://steamcommunity.com/linkfilter/?url=http://www.facebook.com/Steam" target="_blank" rel=" noopener"><img src="https://store.akamai.steamstatic.com/public/images/ico/ico_facebook.gif"> Steam</a>
		&nbsp; | &nbsp;<a href="http://twitter.com/steam" target="_blank" rel=""><img src="https://store.akamai.steamstatic.com/public/images/ico/ico_twitter.gif"> @steam</a>
            </div>
</div>
</div><!-- End Footer -->=
</div></div></div><div class="miniprofile_hover" style="display: none;"><div class="shadow_ul"></div><div class="shadow_top"></div><div class="shadow_ur"></div><div class="shadow_left"></div><div class="shadow_right"></div><div class="shadow_bl"></div><div class="shadow_bottom"></div><div class="shadow_br"></div><div class="miniprofile_hover_inner shadow_content"></div></div></body></html>
