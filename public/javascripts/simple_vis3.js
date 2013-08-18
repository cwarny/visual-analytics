d3.json("/getTweets", function(tweets) {
		var dateFormat = d3.time.format("%a %b %d %X +0000 %Y");
		tweets.forEach(function(d) { d.dd = dateFormat.parse(d.created_at);});

		var ndx = crossfilter(tweets);
		var all = ndx.groupAll();

		var tweetsByTimestamp = ndx.dimension(function(d) { return d.dd; });
		var tweetsGroupsByTimestamp = tweetsByTimestamp.group();
		var tweetsCountsByTimestamp = tweetsGroupsByTimestamp.reduce(
			//add
			function(p,v){
				++p.count;
				p.tweet_length_sum += v.text.length;
				p.tweet_length_avg = p.tweet_length_sum / p.count;
					return p;
				},
			//remove
			function(p,v){
				--p.count;
				p.tweet_length_sum -= v.text.length;
				p.tweet_length_avg = p.tweet_length_sum / p.count;
				return p;
			},
			//init
			function(p,v){
				return {count:0,tweet_length_sum:0,tweet_length_avg:0};
			}
		);

		var maxCount = d3.max(tweetsCountsByTimestamp.order(function(p) {return p.count}).top(Infinity), function(d) {return d.value.count;});
		var minCount = d3.min(tweetsCountsByTimestamp.order(function(p) {return p.count}).top(Infinity), function(d) {return d.value.count;});
		var maxAvgTweetLength = d3.max(tweetsCountsByTimestamp.order(function(p) {return p.tweet_length_avg}).top(Infinity), function(d) {return d.value.tweet_length_avg});
		var minAvgTweetLength = d3.min(tweetsCountsByTimestamp.order(function(p) {return p.tweet_length_avg}).top(Infinity), function(d) {return d.value.tweet_length_avg});
		var maxTimestamp = d3.max(tweetsCountsByTimestamp.orderNatural().top(Infinity), function(d) {return d.key;});
		var minTimestamp = d3.min(tweetsCountsByTimestamp.orderNatural().top(Infinity), function(d) {return d.key;});
		var tweetsByHashtag = ndx.dimension(function (d) {
			if (d.entities.hashtags.length) {
				return d.entities.hashtags[0].text;
			} else {
				return "null";
			}
		});
		var tweetsCountsByHashtag = tweetsByHashtag.group().reduceCount();
		var dic = {};
		tweetsCountsByHashtag.top(Infinity).forEach(function(v,i){dic[v.key] = v.value});
		tweets.forEach(function(d){
			if (d.entities.hashtags.length) {
				d.entities.hashtags[0].count = dic[d.entities.hashtags[0].text]
			}
		});

		var userDimension = ndx.dimension(function (d) {
			return d.user.lang;
		});
		var usersGroup = userDimension.group().reduce(
			//add
			function(p,v) {
				++p.count;
				p.statuses_count_sum += v.user.statuses_count ? v.user.statuses_count : 0;
				p.statuses_count_avg = p.statuses_count_sum / p.count;
				p.friends_count_sum += v.user.friends_count ? v.user.friends_count : 0;
				p.friends_count_avg = p.friends_count_sum / p.count;
				p.followers_count_sum += v.user.followers_count ? v.user.followers_count : 0;
				p.followers_count_avg = p.followers_count_sum / p.count;
				p.tweet_length_sum += v.text.length;
				p.tweet_length_avg = p.tweet_length_sum / p.count;
				return p;
			},
			//remove
			function(p,v) {
				--p.count;
				p.statuses_count_sum -= v.user.statuses_count ? v.user.statuses_count : 0;
				p.statuses_count_avg = p.statuses_count_sum / p.count;
				p.friends_count_sum -= v.user.friends_count ? v.user.friends_count : 0;
				p.friends_count_avg = p.friends_count_sum / p.count;
				p.followers_count_sum -= v.user.followers_count ? v.user.followers_count : 0;
				p.followers_count_avg = p.followers_count_sum / p.count;
				p.tweet_length_sum -= v.text.length;
				p.tweet_length_avg = p.tweet_length_sum / p.count;
				return p;
			},
			//init
			function(p,v) {
				return {count:0,statuses_count_sum:0,statuses_count_avg:0,friends_count_sum:0,friends_count_avg:0,followers_count_sum:0,followers_count_avg:0,tweet_length_sum:0,tweet_length_avg:0};
			}
		);

		var friends_count_max = d3.max(usersGroup.top(Infinity).filter(function(e) {if(typeof e.value.friends_count_avg != 'undefined') return e}), function(d) {return d.value.friends_count_avg});
		var friends_count_min = d3.min(usersGroup.top(Infinity).filter(function(e) {if(typeof e.value.friends_count_avg != 'undefined') return e}), function(d) {return d.value.friends_count_avg});
		var followers_count_max = d3.max(usersGroup.top(Infinity).filter(function(e) {if(typeof e.value.followers_count_avg != 'undefined') return e}), function(d) {return d.value.followers_count_avg});
		var followers_count_min = d3.min(usersGroup.top(Infinity).filter(function(e) {if(typeof e.value.followers_count_avg != 'undefined') return e}), function(d) {return d.value.followers_count_avg});
		var statuses_count_max = d3.max(usersGroup.top(Infinity).filter(function(e) {if(typeof e.value.statuses_count_avg != 'undefined') return e}), function(d) {return d.value.statuses_count_avg});
		var statuses_count_min = d3.min(usersGroup.top(Infinity).filter(function(e) {if(typeof e.value.statuses_count_avg != 'undefined') return e}), function(d) {return d.value.statuses_count_avg});

		d3.json("data/us-states.json", function (statesJson) {

			d3.json("data/states_hash.json", function (states_hash) {

				var states = ndx.dimension(function (d) {
					if (d.place) {
						if (d.place.country_code == 'US') {
							var re = /, (\w{2})$/g;
							try {
								var state = re.exec(d.place.full_name)[1];
								return states_hash[state];
							} catch (err) {
								return 'XXX';
							}
						} else {
							return 'XXX';
						}
					} else {
						return 'XXX';
					}
				});

				var statesGroup = states.group().reduce(
					//add
					function(p,v) {
						++p.count;
						p.statuses_count_sum += v.user.statuses_count ? v.user.statuses_count : 0;
						p.statuses_count_avg = p.statuses_count_sum / p.count;
						p.friends_count_sum += v.user.friends_count ? v.user.friends_count : 0;
						p.friends_count_avg = p.friends_count_sum / p.count;
						p.followers_count_sum += v.user.followers_count ? v.user.followers_count : 0;
						p.followers_count_avg = p.followers_count_sum / p.count;
						p.tweet_length_sum += v.text.length;
						p.tweet_length_avg = p.tweet_length_sum / p.count;
						return p;
					},
					//remove
					function(p,v) {
						--p.count;
						p.statuses_count_sum -= v.user.statuses_count ? v.user.statuses_count : 0;
						p.statuses_count_avg = p.statuses_count_sum / p.count;
						p.friends_count_sum -= v.user.friends_count ? v.user.friends_count : 0;
						p.friends_count_avg = p.friends_count_sum / p.count;
						p.followers_count_sum -= v.user.followers_count ? v.user.followers_count : 0;
						p.followers_count_avg = p.followers_count_sum / p.count;
						p.tweet_length_sum -= v.text.length;
						p.tweet_length_avg = p.tweet_length_sum / p.count;
						return p;
					},
					//init
					function(p,v) {
						return {count:0,statuses_count_sum:0,statuses_count_avg:0,friends_count_sum:0,friends_count_avg:0,followers_count_sum:0,followers_count_avg:0,tweet_length_sum:0,tweet_length_avg:0};
					}
				);
					
				var volumeChart = dc.barChart("#dc-volume-chart");

				volumeChart.width(800)
				    	   .height(200)
				    	   .dimension(tweetsByTimestamp)
				    	   .group(tweetsGroupsByTimestamp)
				    	   .transitionDuration(500)
				    	   .centerBar(true)
				    	   .gap(17)
						   .x(d3.scale.linear().domain([minTimestamp, maxTimestamp]))
						   .valueAccessor(function(p) {return p.value.count})
						   .renderlet(function(chart) {
						   		dc.events.trigger(function() {
						   			bubbleChart.focus(chart.filter());
						   		})
						   })
				    	   .elasticY(true)
				    	   .xAxis().tickFormat(function(v) {return v;});	
				
				var bubbleChart = dc.bubbleChart("#dc-bubble-chart");

				bubbleChart.width(600)
						   .height(300)
						   .dimension(userDimension)
						   .group(usersGroup)
						   .transitionDuration(500)
						   .x(d3.scale.linear().domain([friends_count_min, friends_count_max]))
						   .y(d3.scale.linear().domain([followers_count_min,followers_count_max]))
						   .r(d3.scale.linear().domain([Math.sqrt(statuses_count_min), Math.sqrt(statuses_count_max)]))
						   .colors(["#ff7373"])
						   .maxBubbleRelativeSize(0.05)
						   .keyAccessor(function(p) { return p.value.friends_count_avg; })
						   .valueAccessor(function(p) { return p.value.followers_count_avg})
						   .radiusValueAccessor(function(p) {return Math.sqrt(p.value.statuses_count_avg)})
						   .transitionDuration(500)
						   .elasticX(true)
						   .elasticY(true)
						   .elasticRadius(true)
						   .yAxisPadding(7)
						   .label(function(d) {return d.key;})
						   .renderLabel(true)
						   .margins({top: 10, right: 50, bottom: 30, left: 50});
				
				bubbleChart.yAxis().tickFormat(function(v) {return v;});

				var chloroplethChart = dc.geoChoroplethChart("#dc-us-chart");

				chloroplethChart.width(850)
					            .height(500)
					            .dimension(states)
					            .group(statesGroup)
					            .colors(["#ccc", "#E2F2FF", "#C4E4FF", "#9ED2FF", "#81C5FF", "#6BBAFF", "#51AEFF", "#36A2FF", "#1E96FF", "#0089FF", "#0061B5"])
					            .colorDomain([1, 32])
					            .keyAccessor(function(d) { return d.key; })
						   		.valueAccessor(function(p) { return p.value.count})
				                .overlayGeoJson(statesJson.features, "state", function (d) {
					                return d.properties.name;
					            });

				var dataCount = dc.dataCount("#dc-data-count");
				dataCount.dimension(ndx).group(all);

				var dataTable = dc.dataTable("#dc-table-graph");
				dataTable.width(340).height(850)
						.dimension(tweetsByHashtag)
						.group(function(d) {
							return "List of most popular hashtags";
						})
						.size(7)
						.columns([
							function(d) {
								if (d.entities.hashtags.length) {return d.entities.hashtags[0].text;};
							},
							function(d) {
								if (d.entities.hashtags.length) {return d.entities.hashtags[0].count;};
							}
						])
						.sortBy(function(d){
							if (d.entities.hashtags.length) {return d.entities.hashtags[0].count;};
						})
						.order(d3.descending);

			    chloroplethChart.render();
				volumeChart.render();
				bubbleChart.render();
				dataCount.render();
				dataTable.render();

			});
		});

	});

